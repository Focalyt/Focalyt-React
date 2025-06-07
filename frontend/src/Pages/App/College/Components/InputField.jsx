import React from 'react';

const InputField = ({
    type = "text",
    placeholder,
    value,
    onChange,
    icon,
    disabled = false,
    onKeyPress,
    maxLength,
    style = {}
}) => {
    return (
        <div className="input-field">
            <span className="input-icon">
                <i className={`fa-regular ${icon}`}></i>
            </span>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                onKeyPress={onKeyPress}
                maxLength={maxLength}
                style={style}
            />
        </div>
    );
};

export default InputField; 