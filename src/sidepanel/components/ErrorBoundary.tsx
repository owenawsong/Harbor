import React, { ReactNode, ReactElement } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactElement
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for debugging
    console.error('ErrorBoundary caught:', error, errorInfo.componentStack)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 m-4">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Something went wrong</h2>
            <p className="text-sm text-red-700 dark:text-red-300 text-center mb-4 max-w-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.reset}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <p className="text-xs text-red-600 dark:text-red-400 mt-4 text-center">
              If the problem persists, try refreshing the page or clearing your data in Settings.
            </p>
          </div>
        )
      )
    }

    return this.props.children
  }
}
