import React, { useState } from 'react';
import { Mic, Image, FileText, Upload, Download, User, Users } from 'lucide-react';
import ConversationAnalysis from '../components/ConversationAnalysis';
import ImageAnalysis from '../components/ImageAnalysis';
import Summarization from '../components/Summarization';

const Playground = () => {
  const [selectedSkill, setSelectedSkill] = useState('');

  const skills = [
    {
      id: 'conversation',
      name: 'Conversation Analysis',
      description: 'Transcribe and analyze audio conversations',
      icon: <Mic className="w-6 h-6" />,
      component: ConversationAnalysis
    },
    {
      id: 'image',
      name: 'Image Analysis',
      description: 'Describe and analyze images',
      icon: <Image className="w-6 h-6" />,
      component: ImageAnalysis
    },
    {
      id: 'summarization',
      name: 'Summarization',
      description: 'Summarize text, PDFs, and URLs',
      icon: <FileText className="w-6 h-6" />,
      component: Summarization
    }
  ];

  const SelectedComponent = skills.find(skill => skill.id === selectedSkill)?.component;

  return (
    <div className="min-h-screen bg-linear-gray">
      {/* Header */}
      <header className="bg-white border-b border-linear-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                AI Playground
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, Developer
              </span>
              <button 
                onClick={() => window.location.reload()} 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedSkill ? (
          // Skill Selection
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your AI Tool
            </h2>
            <p className="text-gray-600 mb-8">
              Select a skill to get started with AI-powered analysis
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill.id)}
                  className="bg-white p-6 rounded-lg shadow-soft hover:shadow-md transition-shadow border border-linear-border text-left group"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      {skill.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {skill.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {skill.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Selected Skill Interface
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedSkill('')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back to skills
                </button>
                <h2 className="text-2xl font-bold text-gray-900">
                  {skills.find(s => s.id === selectedSkill)?.name}
                </h2>
              </div>
            </div>
            <SelectedComponent />
          </div>
        )}
      </main>
    </div>
  );
};

export default Playground;
