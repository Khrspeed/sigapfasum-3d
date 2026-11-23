export default function Button3D({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const style =
    variant === "amber"
      ? "btn-3d-amber text-slate-950"
      : "btn-3d-primary text-white";
  return (
    <button
      className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer ${style} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
