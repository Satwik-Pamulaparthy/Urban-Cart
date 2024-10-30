import React, { useState, useEffect } from 'react'
import '../styles/StatusBanner.css'

interface StatusBannerProps {
    message: string
    onClose: () => void
}
const StatusBanner: React.FC<StatusBannerProps> = ({ message, onClose }) => {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        if (message) {
            setIsVisible(true)
            const timer = setTimeout(() => {
                setIsVisible(false)
                onClose()
            }, 5000) // Auto-close after 5 seconds
            return () => clearTimeout(timer)
        }
    }, [message, onClose])

    return (
        <>
            {!isVisible && <></>}
            {isVisible && (
                <div className="status-banner">
                    <p>{message}</p>
                    <button
                        onClick={() => {
                            setIsVisible(false)
                            onClose()
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
        </>
    )
}

export default StatusBanner
