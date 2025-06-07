import React from 'react';

const Button = ({
    text,
    onClick,
    type = "button",
    className = "",
    disabled = false,
    style = {}
}) => {
    return (
        <button
            type={type}
            className={`btn ${className}`}
            onClick={onClick}
            disabled={disabled}
            style={style}
        >
            {text}
        </button>
    );
};

export default Button; 