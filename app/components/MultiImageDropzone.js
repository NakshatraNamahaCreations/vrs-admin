"use client";

import { useRef, useState } from "react";
import { HiOutlineCloudArrowUp, HiOutlineTrash, HiOutlinePlus } from "react-icons/hi2";
import { API_URL, getToken } from "../lib/api";
import styles from "./MultiImageDropzone.module.css";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB per image

/**
 * Multi-image uploader — manages an array of URLs.
 *
 * value    - string[] of stored URLs (e.g. "/uploads/foo.png" or full URLs)
 * onChange - (newArr) => void
 * disabled - disables interactions
 * max      - optional upper cap on how many images can be added. Omit for
 *            unlimited (default).
 */
export default function MultiImageDropzone({ value = [], onChange, disabled, max }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const list = Array.isArray(value) ? value : [];
  const hasCap = typeof max === "number" && max > 0;
  const roomLeft = hasCap ? Math.max(0, max - list.length) : Infinity;
  const canAdd = !disabled && !uploading && roomLeft > 0;

  const resolvePreview = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    if (url.startsWith("/uploads/")) return `${API_URL}${url}`;
    return url;
  };

  const validate = (file) => {
    if (!ACCEPT.includes(file.type)) {
      throw new Error("Please choose a JPEG, PNG, WEBP, AVIF or GIF file.");
    }
    if (file.size > MAX_BYTES) {
      throw new Error(`"${file.name}" is too large. Max 5 MB.`);
    }
  };

  const uploadOne = (file) =>
    new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/api/admin/upload`);
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

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setError("");
    // Trim to remaining slot count (only meaningful when a cap is set).
    const files = hasCap ? Array.from(fileList).slice(0, roomLeft) : Array.from(fileList);
    if (files.length === 0) {
      setError(`You can only add up to ${max} images.`);
      return;
    }
    try {
      setUploading(true);
      const uploaded = [];
      for (const file of files) {
        validate(file);
        setProgress(0);
        const { url } = await uploadOne(file);
        if (url) uploaded.push(url);
      }
      onChange([...list, ...uploaded]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const pick = () => canAdd && inputRef.current?.click();

  const removeAt = (idx) => {
    const next = list.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!canAdd) return;
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (canAdd) setDragging(true);
  };

  return (
    <div>
      <div
        className={`${styles.grid} ${dragging ? styles.dragging : ""} ${disabled ? styles.disabled : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
      >
        {list.map((url, i) => (
          <div key={`${url}-${i}`} className={styles.tile}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolvePreview(url)} alt={`Thumbnail ${i + 1}`} />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className={styles.removeBtn}
              aria-label={`Remove image ${i + 1}`}
              disabled={disabled || uploading}
            >
              <HiOutlineTrash />
            </button>
            <span className={styles.orderBadge}>{i + 1}</span>
          </div>
        ))}

        {roomLeft > 0 && (
          <button
            type="button"
            className={styles.addTile}
            onClick={pick}
            disabled={!canAdd}
            aria-label="Add thumbnail image"
          >
            {uploading ? (
              <div className={styles.progressWrap}>
                <span className={styles.spinner} aria-hidden />
                <em>
                  {progress < 100 ? `Uploading… ${progress}%` : "Processing…"}
                </em>
              </div>
            ) : (
              <>
                <span className={styles.addIcon}>
                  <HiOutlinePlus />
                </span>
                <b>Add image</b>
                <em>or drop files here</em>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT.join(",")}
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className={styles.meta}>
        <span>
          <HiOutlineCloudArrowUp /> PNG, JPG, WEBP · up to 5 MB each · {hasCap ? `${list.length}/${max}` : `${list.length} added`}
        </span>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </div>
  );
}
