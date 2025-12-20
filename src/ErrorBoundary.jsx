import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props){
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error){
    return { error }
  }

  componentDidCatch(error, info){
    // log to console (or send to monitoring)
    console.error('ErrorBoundary caught', error, info)
  }

  render(){
    if(this.state.error){
      return (
        <div style={{padding:20,color:'#fff',background:'#2b031f'}}>
          <h2 style={{marginTop:0}}>Runtime Error</h2>
          <pre style={{whiteSpace:'pre-wrap',overflow:'auto'}}>{String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
