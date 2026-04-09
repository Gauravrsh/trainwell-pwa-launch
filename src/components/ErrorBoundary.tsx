import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Vecto ErrorBoundary]", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span style={{ color: "#9FFF2B" }}>V</span>
            <span className="text-white">ECTO</span>
          </h1>
          <p className="text-white text-xl font-semibold mt-8 mb-2">
            Uh! This shouldn't have happened
          </p>
          <p className="text-gray-400 text-sm mb-8 max-w-xs">
            Something broke on our end. Your data is safe — just hit reload and we'll get you back on track.
          </p>
          <button
            onClick={this.handleReload}
            className="w-full max-w-xs py-3 rounded-lg font-semibold text-black text-base"
            style={{ backgroundColor: "#9FFF2B" }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
