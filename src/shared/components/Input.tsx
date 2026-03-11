import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="form-label">
          {label}
          {props.required && <span className="input-required ml-1">*</span>}
        </label>
      )}
      <input
        className={`form-input ${error ? 'form-input-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="form-label">
          {label}
          {props.required && <span className="input-required ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`form-input resize-none ${error ? 'form-input-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};
