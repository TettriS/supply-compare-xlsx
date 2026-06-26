import { useId, useMemo, useState } from "react";

export type FileSelectProps = {
  label?: string;
  accept?: string;
  multiple?: boolean;
  onFiles: (files: FileList | null) => void;
};

function FileSelect({
  label = "Выбрать файл",
  accept,
  multiple = false,
  onFiles,
}: FileSelectProps) {
  const id = useId();
  const [names, setNames] = useState<string>("Файл не выбран");

  const hint = useMemo(() => {
    return multiple ? "Можно выбрать несколько файлов" : "Один файл";
  }, [multiple]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label htmlFor={id} style={{ fontWeight: 600 }}>
        {label}
      </label>

      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          const files = e.target.files;
          onFiles(files);

          if (!files || files.length === 0) {
            setNames("Файл не выбран");
            return;
          }

          setNames(Array.from(files).map((f) => f.name).join(", "));
        }}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />

      <label
        htmlFor={id}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px 14px",
          border: "1px solid #ccc",
          borderRadius: 8,
          cursor: "pointer",
          background: "#fff",
          width: "fit-content",
        }}
      >
        {label}
      </label>

      <div style={{ fontSize: 14, color: "#555" }}>{hint}</div>
      <div style={{ fontSize: 14 }}>{names}</div>
    </div>
  );
}

export default FileSelect;
