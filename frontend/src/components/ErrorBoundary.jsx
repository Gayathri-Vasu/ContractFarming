import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded">
          Something went wrong while loading this section.
        </div>
      )
    }
    return this.props.children
  }
}

