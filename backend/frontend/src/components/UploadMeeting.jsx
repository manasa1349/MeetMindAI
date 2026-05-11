import { useState, useRef } from 'react'
import { meetingAPI } from '../services/api'

function UploadMeeting({ onNavigate }) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioFile, setAudioFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAudioFile(file)
      setFileName(file.name)
      setError('')
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioFile(audioBlob)
        setFileName('recording.wav')
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setError('')
    } catch (err) {
      setError('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!audioFile) {
      setError('Please upload or record audio first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await meetingAPI.generateAI(1, audioFile)
      
      if (response.success) {
        setSuccess('AI processing completed! Check the Transcript and Summary sections.')
        setTimeout(() => onNavigate('transcript'), 2000)
      } else {
        setError(response.message || 'Failed to process audio')
      }
    } catch (err) {
      setError('Failed to process audio. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-container">
      <h2 className="form-title">Upload or Record Meeting</h2>

      <div className="demo-note">
        📌 Demo Mode: Backend integration will be added later. Audio processing is simulated.
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <div className="upload-icon">📁</div>
        <h3 style={{ marginBottom: '1rem' }}>Upload Audio File</h3>
        <p className="upload-text">Click to select your meeting audio file (MP3, WAV, M4A)</p>
        
        <label htmlFor="audio-upload" className="file-label">
          Choose File
        </label>
        <input
          id="audio-upload"
          type="file"
          className="file-input"
          accept="audio/*"
          onChange={handleFileUpload}
        />

        {fileName && (
          <p style={{ marginTop: '1rem', color: 'var(--success-color)' }}>
            ✓ File selected: {fileName}
          </p>
        )}
      </div>

      {/* Recording Section */}
      <div className="recording-section">
        <h3 style={{ marginBottom: '1rem' }}>Or Record New Meeting</h3>
        
        <div>
          {!isRecording ? (
            <button 
              className="record-button"
              onClick={startRecording}
              disabled={loading}
            >
              🎤 Start Recording
            </button>
          ) : (
            <button 
              className="record-button stop"
              onClick={stopRecording}
            >
              ⏹ Stop Recording
            </button>
          )}
        </div>

        <div className="recording-status">
          {isRecording && (
            <p style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>
              🔴 Recording in progress...
            </p>
          )}
          {fileName && !isRecording && (
            <p style={{ color: 'var(--success-color)' }}>
              ✓ Recording ready: {fileName}
            </p>
          )}
        </div>
      </div>

      {/* Process Section */}
      <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '1rem', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '1rem' }}>Process Audio with AI</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Click below to generate transcript, summary, and action items
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">✓ {success}</div>}

        <button 
          className="btn btn-primary"
          onClick={handleGenerateAI}
          disabled={loading || !audioFile}
          style={{ marginTop: '1rem' }}
        >
          {loading ? 'Processing...' : '✨ Generate AI Insights'}
        </button>
      </div>
    </div>
  )
}

export default UploadMeeting