import React, { useState, useRef } from 'react';
import type { UploadData } from '../types/app';
import { uploadDataset } from '../services/dataApi';
import './FileUpload.css';

interface FileUploadProps {
  onClose?: () => void;
  onContinue?: () => void;
  onUploadSuccess?: (data: UploadData) => void;
}

type Step = 'upload' | 'processing' | 'ready';

export const FileUpload: React.FC<FileUploadProps> = ({ onClose, onContinue, onUploadSuccess }) => {
  const [step, setStep] = useState<Step>('upload');
  const [progressMsg, setProgressMsg] = useState('');
  const [uploadData, setUploadData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const csvFiles = Array.from(files).filter(f => f.name.endsWith('.csv'));
    if (csvFiles.length === 0) {
      setError('Please select valid CSV files only.');
      return;
    }
    setError(null);
    
    // Start Progression
    setStep('processing');
    
    // Simulate Validate step for UX
    setProgressMsg('Validating...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setProgressMsg('Processing...');
    
    try {
      const data = await uploadDataset(csvFiles);
      
      // Simulate slight delay before ready for smooth UX
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setUploadData(data);
      onUploadSuccess?.(data);
      setStep('ready');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setStep('upload');
    }
  };

  return (
    <div className="dataset-ux-container">
      <div className="dataset-header">
        <h2>Dataset</h2>
        <hr className="divider" />
      </div>

      {error && <div className="error-message">{error}</div>}

      {step === 'upload' && (
        <div className="step-upload">
          <p className="instruction">Upload your food nutrition data</p>
          <input 
            ref={inputRef}
            type="file" 
            multiple 
            accept=".csv" 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          <button 
            className="btn-upload" 
            onClick={() => inputRef.current?.click()}
          >
            Upload CSV Files
          </button>
        </div>
      )}

      {step === 'processing' && (
        <div className="step-processing">
          <div className="spinner"></div>
          <p className="processing-text">{progressMsg}</p>
        </div>
      )}

      {step === 'ready' && uploadData && (
        <div className="step-ready">
          <h3 className="preview-title">Dataset Preview</h3>
          
          <div className="preview-stats">
            <div className="stat-line">
              <span className="stat-num">{uploadData.files_processed}</span> files
            </div>
            <div className="stat-line">
              <span className="stat-num">{uploadData.food_items.toLocaleString()}</span> food items
            </div>
            <div className="stat-line">
              <span className="stat-num">{uploadData.columns}</span> nutritional attributes
            </div>
          </div>
          
          <div className="success-message">
            <span className="check-icon">✓</span> Dataset successfully loaded
          </div>

          <button className="btn-primary mt-4" onClick={() => {
            if (onContinue) onContinue();
            else onClose?.();
          }}>
            Continue to Analysis
          </button>
        </div>
      )}
    </div>
  );
};
