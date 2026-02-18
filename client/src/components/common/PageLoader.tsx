import './PageLoader.css';

export default function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-spinner"></div>
      <span className="page-loader-text">Loading...</span>
    </div>
  );
}
