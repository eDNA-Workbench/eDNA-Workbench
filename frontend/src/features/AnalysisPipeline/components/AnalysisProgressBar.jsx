import { useAnalysisContext } from '../../../contexts/AnalysisContext';
import '../styles/components/AnalysisProgressBar.css';

const AnalysisProgressBar = ({ compact = false }) => {
  const { activeStep, isAnalyzing, selectedSpecies } = useAnalysisContext();

  const isComplete = !isAnalyzing

  // Only show if analyzing or if we have an active step (even if paused/error)
  // You might want to customize when it shows. 
  // For now, we follow the logic: if activeStep > 0, we show it.
  if (activeStep === 0) return null;

  return (
    <div className={`analysis-progress-wrapper ${compact ? 'compact' : ''}`}>
      {!compact ? (
        <div className="status-indicator">
          <div className="spinner"></div>
          <span>Analyzing {selectedSpecies || '...'}</span>
        </div>
      ) : (
        isComplete ? (
          <div className="status-indicator">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="ionicon" 
              viewBox="0 0 512 512"
              style={{ width: '20px', height: '20px', color: 'var(--success)' }}
            >
              <path d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="32"/>
              <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M352 176L217.6 336 160 272"/>
            </svg>
          </div>
        ) : (
          <div className="spinner"></div>
        )
      )}
      
      <div className="steps-track">
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <div key={step} className="step-item">
            {!compact && <span className="step-number">{step}</span>}
            <div 
              className={`step-indicator ${
                activeStep > step ? 'completed' : 
                activeStep === step ? 'active' : 'pending'
              }`} 
              title={`Step ${step}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisProgressBar;
