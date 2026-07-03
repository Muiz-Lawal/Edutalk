import React from 'react';
import '../styles/TouchOptimizedForm.css';

/**
 * TouchOptimizedForm
 * Wrapper component ensuring all form elements have proper touch targets
 * and mobile-friendly sizing
 */
export const FormGroup = ({ children, className = '' }) => (
  <div className={`form-group ${className}`}>
    {children}
  </div>
);

export const FormLabel = ({ htmlFor, required = false, children, className = '' }) => (
  <label htmlFor={htmlFor} className={`form-label ${className}`}>
    {children}
    {required && <span className="form-required">*</span>}
  </label>
);

export const FormInput = React.forwardRef(
  ({ type = 'text', label, error, helperText, required = false, ...props }, ref) => (
    <FormGroup>
      {label && (
        <FormLabel htmlFor={props.id} required={required}>
          {label}
        </FormLabel>
      )}
      <input
        ref={ref}
        type={type}
        required={required}
        className={`form-input ${error ? 'error' : ''}`}
        {...props}
      />
      {helperText && (
        <span className={`form-helper ${error ? 'error' : ''}`}>
          {helperText}
        </span>
      )}
      {error && <span className="form-error">{error}</span>}
    </FormGroup>
  )
);

FormInput.displayName = 'FormInput';

export const FormTextarea = React.forwardRef(
  ({ label, error, helperText, required = false, ...props }, ref) => (
    <FormGroup>
      {label && (
        <FormLabel htmlFor={props.id} required={required}>
          {label}
        </FormLabel>
      )}
      <textarea
        ref={ref}
        required={required}
        className={`form-textarea ${error ? 'error' : ''}`}
        {...props}
      />
      {helperText && (
        <span className={`form-helper ${error ? 'error' : ''}`}>
          {helperText}
        </span>
      )}
      {error && <span className="form-error">{error}</span>}
    </FormGroup>
  )
);

FormTextarea.displayName = 'FormTextarea';

export const FormSelect = React.forwardRef(
  ({ label, error, helperText, required = false, options = [], children, ...props }, ref) => (
    <FormGroup>
      {label && (
        <FormLabel htmlFor={props.id} required={required}>
          {label}
        </FormLabel>
      )}
      <select
        ref={ref}
        required={required}
        className={`form-select ${error ? 'error' : ''}`}
        {...props}
      >
        {children}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && (
        <span className={`form-helper ${error ? 'error' : ''}`}>
          {helperText}
        </span>
      )}
      {error && <span className="form-error">{error}</span>}
    </FormGroup>
  )
);

FormSelect.displayName = 'FormSelect';

export const FormCheckbox = React.forwardRef(
  ({ label, error, helperText, ...props }, ref) => (
    <FormGroup className="form-checkbox-group">
      <div className="form-checkbox-wrapper">
        <input ref={ref} type="checkbox" className="form-checkbox" {...props} />
        {label && <FormLabel htmlFor={props.id}>{label}</FormLabel>}
      </div>
      {helperText && (
        <span className={`form-helper ${error ? 'error' : ''}`}>
          {helperText}
        </span>
      )}
      {error && <span className="form-error">{error}</span>}
    </FormGroup>
  )
);

FormCheckbox.displayName = 'FormCheckbox';

export const FormRadio = React.forwardRef(
  ({ label, error, helperText, ...props }, ref) => (
    <FormGroup className="form-radio-group">
      <div className="form-radio-wrapper">
        <input ref={ref} type="radio" className="form-radio" {...props} />
        {label && <FormLabel htmlFor={props.id}>{label}</FormLabel>}
      </div>
      {helperText && (
        <span className={`form-helper ${error ? 'error' : ''}`}>
          {helperText}
        </span>
      )}
      {error && <span className="form-error">{error}</span>}
    </FormGroup>
  )
);

FormRadio.displayName = 'FormRadio';

export const FormButton = React.forwardRef(
  ({ variant = 'primary', size = 'md', fullWidth = false, loading = false, children, ...props }, ref) => (
    <button
      ref={ref}
      className={`form-button form-button-${variant} form-button-${size} ${fullWidth ? 'full-width' : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <span className="button-spinner"></span>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
);

FormButton.displayName = 'FormButton';

/**
 * TouchOptimizedForm
 * Main form wrapper component
 */
const TouchOptimizedForm = React.forwardRef(
  ({ onSubmit, children, ...props }, ref) => (
    <form ref={ref} onSubmit={onSubmit} className="touch-optimized-form" {...props}>
      {children}
    </form>
  )
);

TouchOptimizedForm.displayName = 'TouchOptimizedForm';

export default TouchOptimizedForm;
