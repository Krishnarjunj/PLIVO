import React, { useState } from 'react';
import { Upload, Download, FileText, Link, Type } from 'lucide-react';
import axios from 'axios';

const Summarization = () => {
  const [inputType, setInputType] = useState('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    setError('');

    try {
      let payload = {};

      if (inputType === 'text') {
        if (!text.trim()) {
          setError('Please enter some text to summarize');
          setLoading(false);
          return;
        }
        payload = {
          content: text,
          type: 'text'
        };
      } else if (inputType === 'url') {
        if (!url.trim()) {
          setError('Please enter a URL to summarize');
          setLoading(false);
          return;
        }
        payload = {
          content: url,
          type: 'url'
        };
      } else if (inputType === 'pdf') {
        if (!file) {
          setError('Please select a PDF file');
          setLoading(false);
          return;
        }
        
        // Convert PDF to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target.result.split(',')[1];
          payload = {
            content: base64,
            type: 'pdf'
          };
          
          try {
            const response = await axios.post('https://your-app.onrender.com/summarize', payload);
            setResults(response.data);
          } catch (err) {
            setError(err.response?.data?.error || 'Summarization failed');
          } finally {
            setLoading(false);
          }
        };
        reader.readAsDataURL(file);
        return;
      }

              const response = await axios.post('https://your-app.onrender.com/summarize', payload);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Summarization failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadSummary = () => {
    if (results?.summary) {
      const blob = new Blob([results.summary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'summary.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderInputSection = () => {
    switch (inputType) {
      case 'text':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter text to summarize
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paste your text here..."
            />
          </div>
        );
      
      case 'url':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter URL to summarize
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/article"
            />
          </div>
        );
      
      case 'pdf':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload PDF file
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  Choose a PDF file
                </span>
                <span className="text-gray-500"> or drag and drop</span>
              </label>
              <p className="text-sm text-gray-500 mt-2">
                PDF files up to 10MB
              </p>
            </div>
            {file && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  Selected: {file.name}
                </p>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Type Selection */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Choose Input Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setInputType('text')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              inputType === 'text'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Type className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Text</span>
          </button>
          <button
            onClick={() => setInputType('url')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              inputType === 'url'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Link className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">URL</span>
          </button>
          <button
            onClick={() => setInputType('pdf')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              inputType === 'pdf'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileText className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">PDF</span>
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {inputType === 'text' && 'Enter Text'}
          {inputType === 'url' && 'Enter URL'}
          {inputType === 'pdf' && 'Upload PDF'}
        </h3>
        {renderInputSection()}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSummarize}
          disabled={loading}
          className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-5 h-5 mr-2" />
          {loading ? 'Summarizing...' : 'Generate Summary'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Summary
            </h3>
            <button
              onClick={downloadSummary}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </button>
          </div>
          <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
            <p className="text-gray-700 whitespace-pre-wrap">
              {results.summary}
            </p>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Original length: {results.original_length} characters
            {results.type && ` • Type: ${results.type}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default Summarization;
