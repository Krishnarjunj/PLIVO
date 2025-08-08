import React, { useState } from 'react';
import { Upload, Download, User, Users, Mic } from 'lucide-react';
import axios from 'axios';

const ConversationAnalysis = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('audio/')) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid audio file (MP3, WAV, M4A)');
    }
  };

  const handleTranscribe = async () => {
    if (!file) {
      setError('Please select an audio file');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('https://plivo-aemg.onrender.com/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResults({
        type: 'transcript',
        data: response.data
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Transcription failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDiarize = async () => {
    if (!file) {
      setError('Please select an audio file');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('https://plivo-aemg.onrender.com/diarize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResults({
        type: 'diarization',
        data: response.data
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Diarization failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTranscript = () => {
    if (results?.type === 'transcript') {
      const blob = new Blob([results.data.transcript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transcript.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upload Audio File
        </h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
            id="audio-upload"
          />
          <label htmlFor="audio-upload" className="cursor-pointer">
            <span className="text-blue-600 hover:text-blue-700 font-medium">
              Choose an audio file
            </span>
            <span className="text-gray-500"> or drag and drop</span>
          </label>
          <p className="text-sm text-gray-500 mt-2">
            MP3, WAV, M4A up to 10MB
          </p>
        </div>
        {file && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              Selected: {file.name}
            </p>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleTranscribe}
          disabled={!file || loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mic className="w-4 h-4 mr-2" />
          {loading ? 'Processing...' : 'Transcribe'}
        </button>
        <button
          onClick={handleDiarize}
          disabled={!file || loading}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Users className="w-4 h-4 mr-2" />
          {loading ? 'Processing...' : 'Diarize'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {results.type === 'transcript' && (
            <div className="bg-white rounded-lg shadow-soft p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Transcript
                </h3>
                <button
                  onClick={downloadTranscript}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>
              <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {results.data.transcript}
                </p>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Duration: {Math.round(results.data.duration)}s
              </div>
            </div>
          )}

          {results.type === 'diarization' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-soft p-6">
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Speaker 1
                  </h3>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.data.speaker1.map((segment, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-md">
                      <div className="text-xs text-blue-600 mb-1">
                        {Math.round(segment.start)}s - {Math.round(segment.end)}s
                      </div>
                      <div className="text-sm text-gray-700">
                        {segment.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-soft p-6">
                <div className="flex items-center mb-4">
                  <Users className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Speaker 2
                  </h3>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.data.speaker2.map((segment, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-md">
                      <div className="text-xs text-green-600 mb-1">
                        {Math.round(segment.start)}s - {Math.round(segment.end)}s
                      </div>
                      <div className="text-sm text-gray-700">
                        {segment.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationAnalysis;

