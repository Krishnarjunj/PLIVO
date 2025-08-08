# AI-Powered Multi-Modal Playground

A complete AI playground application with transcription, image analysis, and summarization capabilities using Groq API.

## 🚀 Features

### Backend (Flask)
- **Transcription**: Convert audio files to text using Groq API
- **Diarization**: Basic 2-speaker separation using silence detection
- **Image Analysis**: Describe images using Groq Vision
- **Summarization**: Summarize text, PDFs, and URLs
- **Rate Limiting**: Basic in-memory rate limiting
- **Request Logging**: Track last 10 requests

### Frontend (React + TailwindCSS)
- **Authentication**: Clerk integration for email login
- **Dynamic UI**: Skill-based interface switching
- **File Upload**: Drag & drop support
- **Results Display**: Clean card-based layout
- **Download**: Export results as text files

## 🛠 Tech Stack

- **Backend**: Flask, Groq API, librosa, PyPDF2
- **Frontend**: React, TailwindCSS, Clerk Auth, Lucide Icons
- **Deployment**: Vercel (frontend), Render/Replit (backend)

## 📁 Project Structure

```
PLIVO/
├── server/
│   ├── app.py              # Flask backend
│   └── requirements.txt    # Python dependencies
├── client/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   └── index.css      # Tailwind styles
│   ├── public/
│   └── package.json       # Node dependencies
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- Groq API key
- Clerk account

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables:**
   ```bash
   export GROQ_API_KEY="your_groq_api_key_here"
   export ASSEMBLY_AI_API_KEY="your_assembly_ai_api_key_here"
   export GEMINI_API_KEY="your_gemini_api_key_here"
   ```

4. **Run the Flask server:**
   ```bash
   python app.py
   ```

   Server will start at `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Set environment variables:**
   Create `.env` file:
   ```
   REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

4. **Start development server:**
   ```bash
   npm start
   ```

   App will open at `http://localhost:3000`

## 🌐 API Endpoints

### Backend Endpoints

- `GET /health` - Health check
- `POST /transcribe` - Audio transcription
- `POST /diarize` - Speaker diarization
- `POST /describe-image` - Image description
- `POST /summarize` - Text/PDF/URL summarization
- `GET /requests` - Request history

### Request Examples

**Transcribe Audio:**
```bash
curl -X POST -F "file=@audio.mp3" http://localhost:5000/transcribe
```

**Describe Image:**
```bash
curl -X POST -F "file=@image.jpg" http://localhost:5000/describe-image
```

**Summarize Text:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"content":"Your text here","type":"text"}' \
  http://localhost:5000/summarize
```

## 🚀 Deployment

### Backend Deployment (Render)

1. **Create Render account** and new Web Service
2. **Connect your GitHub repository**
3. **Configure environment:**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
   - Environment Variables: `GROQ_API_KEY`

### Frontend Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from client directory:**
   ```bash
   cd client
   vercel
   ```

3. **Set environment variables in Vercel dashboard:**
   - `REACT_APP_CLERK_PUBLISHABLE_KEY`

### Environment Variables

**Backend:**
- `GROQ_API_KEY` - Your Groq API key

**Frontend:**
- `REACT_APP_CLERK_PUBLISHABLE_KEY` - Clerk publishable key

## 🔧 Configuration

### Groq API Setup
1. Sign up at [groq.com](https://groq.com)
2. Get your API key from dashboard
3. Add to environment variables

### Clerk Auth Setup
1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Get publishable key
4. Configure email authentication

## 📊 Features in Detail

### Conversation Analysis
- **Transcription**: Convert audio to text with Groq
- **Diarization**: Basic speaker separation using:
  - Silence detection
  - Volume clustering
  - 2-speaker classification

### Image Analysis
- **Vision API**: Describe images using Groq
- **File Support**: PNG, JPG, JPEG
- **Preview**: Image preview before analysis

### Summarization
- **Text**: Direct text input
- **URL**: Web page content extraction
- **PDF**: PDF text extraction and summarization

## 🛡️ Security & Rate Limiting

- **Rate Limiting**: 100 requests per hour (in-memory)
- **File Validation**: Type and size checks
- **Error Handling**: Comprehensive error responses
- **CORS**: Configured for frontend communication

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check Python version (3.8+)
- Verify GROQ_API_KEY is set
- Install all requirements

**Frontend won't start:**
- Check Node.js version (16+)
- Verify Clerk key is set
- Clear npm cache: `npm cache clean --force`

**API calls failing:**
- Check CORS configuration
- Verify backend is running on port 5000
- Check Groq API key validity

### Development Tips

- Use `python -m flask run` for development
- Enable hot reload with `npm start`
- Check browser console for frontend errors
- Monitor Flask logs for backend issues

## 📝 License

MIT License - feel free to use this project for your own applications.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

**Built with ❤️ using Flask, React, and Groq API**
