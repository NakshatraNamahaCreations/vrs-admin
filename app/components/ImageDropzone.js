"use client";

import { useRef, useState } from "react";
import { HiOutlineCloudArrowUp, HiOutlineTrash } from "react-icons/hi2";
import { API_URL, getToken } from "../lib/api";
import styles from "./ImageDropzone.module.css";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export default function ImageDropzone({ value, onChange, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const preview = value
    ? value.startsWith("http") || value.startsWith("data:")
      ? value
      : `${API_URL}${value}`
    : null;

  const pick = () => !disabled && !uploading && inputRef.current?.click();

  const validate = (file) => {
    if (!ACCEPT.includes(file.type)) {
      throw new Error("Please choose a JPEG, PNG, WEBP, AVIF or GIF file.");
    }
    if (file.size > MAX_BYTES) {
      throw new Error(`File is too large. Max 5 MB (yours: ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
    }
  };

  const upload = (file) => {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/api/admin/upload`);
      // Fail loudly instead of hanging forever if the server never responds
      // (Vercel Hobby caps at ~10s, but slow networks or a stuck Cloudinary
      // upload can leave the client waiting indefinitely).
      xhr.timeout = 60_000;
      const token = getToken();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(new Error(data.error || `Upload failed (${xhr.status})`));
        } catch (err) {
          reject(new Error("Malformed response from server"));
        }
      };
      xhr.onerror = () => reject(new Error("Network error while uploading"));
      xhr.ontimeout = () => reject(new Error("Server took too long to respond. Try a smaller image, or check the backend logs."));
      xhr.send(fd);
    });
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    try {
      validate(file);
      setUploading(true);
      setProgress(0);
      const { url } = await upload(file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !uploading) setDragging(true);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div
        className={`${styles.zone} ${dragging ? styles.dragging : ""} ${preview ? styles.hasPreview : ""} ${disabled ? styles.disabled : ""}`}
        onClick={pick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pick()}
      >
        {preview ? (
          <div className={styles.previewWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Product preview" className={styles.preview} />
            <button
              type="button"
              onClick={clear}
              className={styles.removeBtn}
              aria-label="Remove image"
              disabled={uploading}
            >
              <HiOutlineTrash />
            </button>
            {!uploading && (
              <div className={styles.overlay}>
                <span>Click or drop to replace</span>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.icon}>
              <HiOutlineCloudArrowUp />
            </span>
            <b>Drop an image here</b>
            <em>or click to browse · PNG, JPG, WEBP · up to 5 MB</em>
          </div>
        )}

        {uploading && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            <span>
              {progress < 100
                ? `Uploading… ${progress}%`
                : "Processing on server…"}
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className={styles.error}>{error}</p>}
      {value && !uploading && (
        <p className={styles.pathHint}>
          Stored as <code>{value}</code>
        </p>
      )}
    </div>
  );
}
