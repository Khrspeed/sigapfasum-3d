export default function Card3D({ children, className = "" }) {
  return (
    <div className={`card-3d rounded-3xl p-4 ${className}`}>{children}</div>
  );
}
