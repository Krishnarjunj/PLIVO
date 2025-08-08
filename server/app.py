from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from datetime import datetime
import requests
from werkzeug.utils import secure_filename
import json
import librosa
import numpy as np
from collections import deque
import PyPDF2
import io
import base64
from PIL import Image

app = Flask(__name__)
CORS(app)

# Configuration
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
ASSEMBLY_AI_API_KEY = os.getenv('ASSEMBLY_AI_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
UPLOAD_FOLDER = 'uploads'
ALLOWED_AUDIO_EXTENSIONS = {'mp3', 'wav', 'm4a'}
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg'}
ALLOWED_PDF_EXTENSIONS = {'pdf'}

# Rate limiting and logging
request_history = deque(maxlen=10)
rate_limit = 100  # requests per hour

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def log_request(endpoint, status, error=None):
    request_history.append({
        'endpoint': endpoint,
        'timestamp': datetime.now().isoformat(),
        'status': status,
        'error': str(error) if error else None
    })

def check_rate_limit():
    # Simple rate limiting - in production, use Redis
    if len(request_history) >= rate_limit:
        return False
    return True

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy', 
        'groq_configured': bool(GROQ_API_KEY),
        'assembly_ai_configured': bool(ASSEMBLY_AI_API_KEY),
        'gemini_configured': bool(GEMINI_API_KEY)
    })

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if not check_rate_limit():
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    if 'file' not in request.files:
        log_request('/transcribe', 'error', 'No file provided')
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        log_request('/transcribe', 'error', 'No file selected')
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename, ALLOWED_AUDIO_EXTENSIONS):
        log_request('/transcribe', 'error', 'Unsupported file type')
        return jsonify({'error': 'Unsupported file type'}), 400
    
    try:
        # Check if Assembly AI API key is configured
        if not ASSEMBLY_AI_API_KEY:
            log_request('/transcribe', 'error', 'Assembly AI API key not configured')
            return jsonify({'error': 'Assembly AI API key not configured. Please set ASSEMBLY_AI_API_KEY environment variable.'}), 500
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Read audio file
        audio, sr = librosa.load(filepath, sr=None)
        
        # Upload to Assembly AI for transcription
        headers = {
            'Authorization': ASSEMBLY_AI_API_KEY
        }
        
        # First, upload the audio file
        with open(filepath, 'rb') as f:
            upload_response = requests.post(
                'https://api.assemblyai.com/v2/upload',
                headers=headers,
                data=f
            )
        
        if upload_response.status_code != 200:
            log_request('/transcribe', 'error', f'Assembly AI upload error: {upload_response.status_code}')
            return jsonify({'error': 'Audio upload failed'}), 500
        
        upload_url = upload_response.json()['upload_url']
        
        # Submit transcription job
        transcript_response = requests.post(
            'https://api.assemblyai.com/v2/transcript',
            json={
                'audio_url': upload_url,
                'speaker_labels': True
            },
            headers=headers
        )
        
        if transcript_response.status_code != 200:
            log_request('/transcribe', 'error', f'Assembly AI transcript error: {transcript_response.status_code}')
            return jsonify({'error': 'Transcription job failed'}), 500
        
        transcript_id = transcript_response.json()['id']
        
        # Poll for completion
        while True:
            polling_response = requests.get(
                f'https://api.assemblyai.com/v2/transcript/{transcript_id}',
                headers=headers
            )
            
            if polling_response.status_code != 200:
                log_request('/transcribe', 'error', f'Assembly AI polling error: {polling_response.status_code}')
                return jsonify({'error': 'Transcription polling failed'}), 500
            
            status = polling_response.json()['status']
            
            if status == 'completed':
                result = polling_response.json()
                transcript = result['text']
                
                # Clean up file
                os.remove(filepath)
                
                log_request('/transcribe', 'success')
                return jsonify({
                    'transcript': transcript,
                    'duration': len(audio) / sr
                })
            elif status == 'error':
                log_request('/transcribe', 'error', 'Assembly AI transcription failed')
                return jsonify({'error': 'Transcription failed'}), 500
            
            # Wait 1 second before polling again
            import time
            time.sleep(1)
            
    except Exception as e:
        log_request('/transcribe', 'error', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/diarize', methods=['POST'])
def diarize():
    if not check_rate_limit():
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    if 'file' not in request.files:
        log_request('/diarize', 'error', 'No file provided')
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        log_request('/diarize', 'error', 'No file selected')
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename, ALLOWED_AUDIO_EXTENSIONS):
        log_request('/diarize', 'error', 'Unsupported file type')
        return jsonify({'error': 'Unsupported file type'}), 400
    
    try:
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Load audio
        audio, sr = librosa.load(filepath, sr=None)
        
        # Basic diarization using silence detection and volume clustering
        # This is a simplified approach - in production, use more sophisticated methods
        
        # Detect silence periods
        silence_threshold = 0.01
        silence_mask = np.abs(audio) < silence_threshold
        
        # Find speech segments
        speech_segments = []
        current_segment = []
        in_speech = False
        
        for i, is_silent in enumerate(silence_mask):
            if not is_silent and not in_speech:
                # Start of speech
                in_speech = True
                current_segment = [i]
            elif is_silent and in_speech:
                # End of speech
                in_speech = False
                current_segment.append(i)
                if current_segment[1] - current_segment[0] > sr * 0.5:  # Min 0.5s segment
                    speech_segments.append(current_segment)
        
        # Simple 2-speaker separation based on volume levels
        speaker1_segments = []
        speaker2_segments = []
        
        if len(speech_segments) > 0:
            # Calculate median volume for comparison
            segment_volumes = [np.mean(np.abs(audio[s[0]:s[1]])) for s in speech_segments]
            median_volume = np.median(segment_volumes) if segment_volumes else 0
            
            for segment in speech_segments:
                segment_audio = audio[segment[0]:segment[1]]
                avg_volume = np.mean(np.abs(segment_audio))
                
                if avg_volume > median_volume:
                    speaker1_segments.append({
                        'start': segment[0] / sr,
                        'end': segment[1] / sr,
                        'text': f"Speaker 1 segment {len(speaker1_segments) + 1}"
                    })
                else:
                    speaker2_segments.append({
                        'start': segment[0] / sr,
                        'end': segment[1] / sr,
                        'text': f"Speaker 2 segment {len(speaker2_segments) + 1}"
                    })
        else:
            # If no speech segments found, create a default response
            speaker1_segments.append({
                'start': 0,
                'end': len(audio) / sr,
                'text': "No clear speech segments detected"
            })
        
        # Clean up file
        os.remove(filepath)
        
        log_request('/diarize', 'success')
        return jsonify({
            'speaker1': speaker1_segments,
            'speaker2': speaker2_segments,
            'total_segments': len(speech_segments)
        })
        
    except Exception as e:
        log_request('/diarize', 'error', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/describe-image', methods=['POST'])
def describe_image():
    if not check_rate_limit():
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    if 'file' not in request.files:
        log_request('/describe-image', 'error', 'No file provided')
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        log_request('/describe-image', 'error', 'No file selected')
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        log_request('/describe-image', 'error', 'Unsupported file type')
        return jsonify({'error': 'Unsupported file type'}), 400
    
    try:
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Convert image to base64
        with open(filepath, 'rb') as f:
            image_base64 = base64.b64encode(f.read()).decode('utf-8')
        
        # Use Gemini API for image analysis
        try:
            # Check if Gemini API key is configured
            if not GEMINI_API_KEY:
                log_request('/describe-image', 'error', 'Gemini API key not configured')
                return jsonify({'error': 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.'}), 500
            
            # Convert image to base64
            with open(filepath, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
            
            # Call Gemini API for image analysis
            headers = {
                'Content-Type': 'application/json',
                'X-goog-api-key': GEMINI_API_KEY
            }
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": "Describe this image in detail. What do you see in the image?"
                            },
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": image_data
                                }
                            }
                        ]
                    }
                ]
            }
            
            response = requests.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                # Extract the description from Gemini response
                if 'candidates' in result and len(result['candidates']) > 0:
                    description = result['candidates'][0]['content']['parts'][0]['text']
                else:
                    description = "Image analysis completed"
            else:
                # Fallback to basic image analysis
                from PIL import Image
                img = Image.open(filepath)
                
                # Get dominant colors
                img_small = img.resize((150, 150))
                colors = img_small.getcolors(maxcolors=256)
                if colors:
                    dominant_color = max(colors, key=lambda x: x[0])[1]
                    r, g, b = dominant_color
                    
                    # Simple color-based description
                    if r > 200 and g > 200 and b > 200:
                        color_desc = "light/white"
                    elif r < 50 and g < 50 and b < 50:
                        color_desc = "dark/black"
                    elif r > g and r > b:
                        color_desc = "reddish"
                    elif g > r and g > b:
                        color_desc = "greenish"
                    elif b > r and b > g:
                        color_desc = "bluish"
                    else:
                        color_desc = "mixed colors"
                    
                    description = f"This image appears to have {color_desc} tones. "
                else:
                    description = "This image has been analyzed. "
                
                # Add orientation info
                width, height = img.size
                if width > height:
                    description += "It's a landscape-oriented image. "
                elif height > width:
                    description += "It's a portrait-oriented image. "
                else:
                    description += "It's a square image. "
            
            # Clean up file
            os.remove(filepath)
            
            log_request('/describe-image', 'success')
            return jsonify({
                'description': description,
                'filename': filename
            })
            
        except Exception as img_error:
            log_request('/describe-image', 'error', f'Image processing error: {str(img_error)}')
            return jsonify({'error': 'Image processing failed'}), 500
            
    except Exception as e:
        log_request('/describe-image', 'error', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/summarize', methods=['POST'])
def summarize():
    if not check_rate_limit():
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    data = request.get_json()
    if not data or 'content' not in data:
        log_request('/summarize', 'error', 'No content provided')
        return jsonify({'error': 'No content provided'}), 400
    
    content = data['content']
    content_type = data.get('type', 'text')  # 'text', 'pdf', or 'url'
    
    try:
        text_to_summarize = ""
        
        if content_type == 'url':
            # Fetch content from URL
            response = requests.get(content)
            text_to_summarize = response.text
        elif content_type == 'pdf':
            # Handle PDF content (base64 encoded)
            pdf_data = base64.b64decode(content)
            pdf_file = io.BytesIO(pdf_data)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text_to_summarize = ""
            for page in pdf_reader.pages:
                text_to_summarize += page.extract_text()
        else:
            # Plain text
            text_to_summarize = content
        
        if not text_to_summarize.strip():
            log_request('/summarize', 'error', 'Empty content')
            return jsonify({'error': 'Empty content'}), 400
        
        # Check if Gemini API key is configured
        if not GEMINI_API_KEY:
            log_request('/summarize', 'error', 'Gemini API key not configured')
            return jsonify({'error': 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.'}), 500
        
        # Call Gemini API for summarization
        headers = {
            'Content-Type': 'application/json',
            'X-goog-api-key': GEMINI_API_KEY
        }
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"Please provide a comprehensive summary of the following content:\n\n{text_to_summarize[:4000]}"
                        }
                    ]
                }
            ]
        }
        
        print(f"Calling Gemini API with key: {GEMINI_API_KEY[:10]}...")  # Debug: show first 10 chars
        response = requests.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
            headers=headers,
            json=payload
        )
        
        print(f"Gemini API response status: {response.status_code}")  # Debug: show status
        print(f"Gemini API response: {response.text[:200]}...")  # Debug: show first 200 chars
        
        if response.status_code == 200:
            result = response.json()
            # Extract the summary from Gemini response
            if 'candidates' in result and len(result['candidates']) > 0:
                summary = result['candidates'][0]['content']['parts'][0]['text']
            else:
                summary = "Summary generation completed"
            
            log_request('/summarize', 'success')
            return jsonify({
                'summary': summary,
                'original_length': len(text_to_summarize),
                'type': content_type
            })
        else:
            error_msg = f'Gemini API error: {response.status_code}'
            try:
                error_detail = response.json()
                error_msg += f' - {error_detail}'
            except:
                error_msg += f' - Response: {response.text[:200]}'
            log_request('/summarize', 'error', error_msg)
            return jsonify({'error': f'Summarization failed: {error_msg}'}), 500
            
    except Exception as e:
        log_request('/summarize', 'error', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/requests', methods=['GET'])
def get_requests():
    return jsonify({'requests': list(request_history)})

@app.route('/test-gemini', methods=['GET'])
def test_gemini():
    """Test endpoint to verify Gemini API key"""
    if not GEMINI_API_KEY:
        return jsonify({'error': 'Gemini API key not configured'}), 500
    
    headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
    }
    
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": "Hello, this is a test message. Please respond with a simple greeting."
                    }
                ]
            }
        ]
    }
    
    try:
        response = requests.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                response_text = result['candidates'][0]['content']['parts'][0]['text']
            else:
                response_text = "Test completed"
            
            return jsonify({
                'status': 'success',
                'message': 'Gemini API is working correctly',
                'response': response_text
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Gemini API error: {response.status_code}',
                'response': response.text
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Exception: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
