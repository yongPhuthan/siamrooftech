"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { UploadResult, uploadImageToCloudflare } from "../../app/lib/cloudflare/uploadImage";
import MediaUploadTabs, { LocalImageFile, LocalVideoFile } from "./MediaUploadTabs";
import { Project, ProjectImage, ProjectVideo } from "../../lib/firestore";
import { getAfterImages, getBeforeImages } from "../../lib/project-image-utils";
import { uploadVideoToCloudflare } from "../../lib/cloudflare/uploadVideo";
import PDFAutofillComponent from "./PDFAutofillComponent";

interface ProjectFormData {
  width: number;
  extension: number;
  description: string[];
  category: string;
  location: string;
  year: string;
  type: "ระบบมือหมุน" | "มอเตอร์ไฟฟ้า" | "สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)";
  arms_count: "2" | "3" | "4" | "5"; // จำนวนแขนพับ
  canvas_material: "ผ้าอะคริลิคสเปน" | "ผ้าอะคริลิค"; // วัสดุผ้าใบ
  fabric_edge: "ตัดเรียบ" | "โค้งลอน" | "ตัดเรียบ + พิมพ์ Logo" | "โค้งลอน + พิมพ์ Logo"; // ชายผ้า
  featured_image?: string;
  slug?: string; // จะถูกสร้างอัตโนมัติจากขนาด
  images: ProjectImage[];
  videos?: ProjectVideo[]; // Optional videos array
}

const categories = [
  "ร้านอาหาร",
  "โรงแรม",
  "คาเฟ่",
  "บ้านพักอาศัย",
  "สำนักงาน",
  "ร้านค้า",
  "โรงงาน",
  "สถานศึกษา",
  "โรงพยาบาล",
  "อื่นๆ",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

// ฟังก์ชันสร้าง slug จากขนาดและเวลา เพื่อป้องกันการซ้ำ
const generateSlug = (width: number, extension: number): string => {
  const timestamp = Date.now().toString().slice(-6); // ใช้ 6 หลักสุดท้ายของ timestamp
  const sizeSlug = `${width}x${extension}`.replace('.', '-'); // แทนที่จุดด้วยขีด
  return `${sizeSlug}-${timestamp}`.toLowerCase();
};

// ฟังก์ชันสร้าง title จากขนาด
const generateTitle = (width: number, extension: number): string => {
  return `${width} x ${extension}`;
};

interface ProjectFormProps {
  project?: Project | null;
  onSuccess?: () => void;
}

export default function ProjectForm({ project, onSuccess }: ProjectFormProps = {}) {
  const [formData, setFormData] = useState<ProjectFormData>({
    width: 0,
    extension: 0,
    description: [""],
    category: "",
    location: "",
    year: currentYear.toString(),
    type: "ระบบมือหมุน",
    arms_count: "2",
    canvas_material: "ผ้าอะคริลิคสเปน",
    fabric_edge: "ตัดเรียบ",
    images: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [revalidationStatus, setRevalidationStatus] = useState<{
    completed: boolean;
    success: boolean;
    details?: any;
  } | null>(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [deletingImageIndex, setDeletingImageIndex] = useState<number | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Separate state for Before/After images (already uploaded)
  const [afterImages, setAfterImages] = useState<ProjectImage[]>([]);
  const [beforeImages, setBeforeImages] = useState<ProjectImage[]>([]);

  // Separate state for local preview files (not yet uploaded)
  const [localAfterFiles, setLocalAfterFiles] = useState<LocalImageFile[]>([]);
  const [localBeforeFiles, setLocalBeforeFiles] = useState<LocalImageFile[]>([]);

  // Video state (NEW)
  const [videos, setVideos] = useState<ProjectVideo[]>([]);
  const [localVideoFiles, setLocalVideoFiles] = useState<LocalVideoFile[]>([]);

  // Initialize before/after images and videos when project is loaded
  useEffect(() => {
    if (project) {
      if (project.images) {
        setAfterImages(getAfterImages(project));
        setBeforeImages(getBeforeImages(project));
      }
      if (project.videos) {
        setVideos(project.videos);
      }
    }
  }, [project]);

  // Handle PDF autofill data
  const handlePDFAutofillData = (data: any) => {
    // Update form data with extracted information
    setFormData(prev => ({
      ...prev,
      ...(data.title && { title: data.title }),
      ...(data.location && { location: data.location }),
      ...(data.width && { width: data.width }),
      ...(data.extension && { extension: data.extension }),
      ...(data.category && categories.includes(data.category) && { category: data.category }),
      ...(data.type && (data.type === "ระบบมือหมุน" || data.type === "มอเตอร์ไฟฟ้า" || data.type === "สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)") && { type: data.type }),
      ...(data.arms_count && ["2", "3", "4", "5"].includes(data.arms_count) && { arms_count: data.arms_count }),
      ...(data.canvas_material && ["ผ้าอะคริลิคสเปน", "ผ้าอะคริลิค"].includes(data.canvas_material) && { canvas_material: data.canvas_material }),
      ...(data.fabric_edge && ["ตัดเรียบ", "โค้งลอน", "ตัดเรียบ + พิมพ์ Logo", "โค้งลอน + พิมพ์ Logo"].includes(data.fabric_edge) && { fabric_edge: data.fabric_edge }),
    }));

  };

  // Delete individual image from Firestore
  const handleDeleteImage = async (imageIndex: number) => {
    if (!project || !project.images) return;

    setDeletingImageIndex(imageIndex);

    try {
      // Create updated images array without the deleted image
      const updatedImages = project.images.filter((_, index) => index !== imageIndex);

      // Update featured_image if the deleted image was the featured image
      let updatedFeaturedImage = project.featured_image;
      if (project.featured_image === project.images[imageIndex]?.original_size) {
        updatedFeaturedImage = updatedImages.length > 0 ? updatedImages[0].original_size : '';
      }

      // Update Firestore
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        images: updatedImages,
        featured_image: updatedFeaturedImage,
        updated_at: new Date()
      });

      // Update local state
      if (project.images) {
        project.images = updatedImages;
        project.featured_image = updatedFeaturedImage;
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('เกิดข้อผิดพลาดในการลบรูปภาพ กรุณาลองใหม่');
    } finally {
      setDeletingImageIndex(null);
    }
  };

  // Helper function to upload local files to Cloudflare and convert to ProjectImage
  const uploadLocalFilesToCloudflare = async (
    localFiles: LocalImageFile[],
    type: 'before' | 'after',
    startIndex: number
  ): Promise<ProjectImage[]> => {
    if (localFiles.length === 0) return [];

    const uploadPromises = localFiles.map(async (localFile) => {
      return await uploadImageToCloudflare(localFile.file);
    });

    const uploadResults: UploadResult[] = await Promise.all(uploadPromises);

    // Convert to ProjectImage format
    const newImages: ProjectImage[] = uploadResults.map((result, index) => ({
      id: `${Date.now()}-${index}`,
      project_id: project?.id || '',
      small_size: result.thumbnailUrl || result.mediumUrl || result.originalUrl || '',
      medium_size: result.mediumUrl || result.originalUrl || result.thumbnailUrl || '',
      original_size: result.originalUrl || result.mediumUrl || result.thumbnailUrl || '',
      alt_text: `กันสาดพับได้ ${generateTitle(formData.width, formData.extension)} - ${type === 'after' ? 'หลังติดตั้ง' : 'ก่อนติดตั้ง'} รูปที่ ${startIndex + index + 1}`,
      title: `กันสาดพับได้ ${generateTitle(formData.width, formData.extension)}`,
      caption: '',
      type: type,
      order_index: startIndex + index,
    }));

    return newImages;
  };

  // Handler for video delete
  const handleVideoDelete = async (videoId: string) => {
    try {
      const updatedVideos = videos.filter(v => v.id !== videoId);
      setVideos(updatedVideos);

      // Update Firestore if editing existing project
      if (project && project.id) {
        const projectRef = doc(db, 'projects', project.id);
        await updateDoc(projectRef, {
          videos: updatedVideos,
          updated_at: new Date(),
        });

        // Update local project state
        if (project.videos) {
          project.videos = updatedVideos;
        }
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('เกิดข้อผิดพลาดในการลบวีดีโอ กรุณาลองใหม่');
    }
  };

  // Handler for video type change
  const handleVideoTypeChange = (videoId: string, type: 'before' | 'after' | 'during' | 'detail') => {
    const updatedVideos = videos.map(v =>
      v.id === videoId ? { ...v, type } : v
    );
    setVideos(updatedVideos);

    // Update Firestore if editing existing project
    if (project && project.id) {
      const projectRef = doc(db, 'projects', project.id);
      updateDoc(projectRef, {
        videos: updatedVideos,
        updated_at: new Date(),
      }).catch(error => {
        console.error('Error updating video type:', error);
      });
    }
  };

  // Handler for ImageUploadTabs - Delete image
  const handleTabImageDelete = async (imageId: string, type: 'before' | 'after') => {
    try {
      const targetImages = type === 'after' ? afterImages : beforeImages;
      const updatedImages = targetImages.filter(img => img.id !== imageId);

      // Update state
      if (type === 'after') {
        setAfterImages(updatedImages);
      } else {
        setBeforeImages(updatedImages);
      }

      // Update Firestore if editing existing project
      if (project && project.id) {
        const allImages = type === 'after'
          ? [...updatedImages, ...beforeImages]
          : [...afterImages, ...updatedImages];

        const projectRef = doc(db, 'projects', project.id);
        await updateDoc(projectRef, {
          images: allImages,
          updated_at: new Date(),
        });

        // Update local project state
        if (project.images) {
          project.images = allImages;
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('เกิดข้อผิดพลาดในการลบรูปภาพ กรุณาลองใหม่');
    }
  };

  // Handler for ImageUploadTabs - Reorder images
  const handleTabImageReorder = async (images: ProjectImage[], type: 'before' | 'after') => {
    try {
      // Update state
      if (type === 'after') {
        setAfterImages(images);
      } else {
        setBeforeImages(images);
      }

      // Update Firestore if editing existing project
      if (project && project.id) {
        const allImages = type === 'after'
          ? [...images, ...beforeImages]
          : [...afterImages, ...images];

        const projectRef = doc(db, 'projects', project.id);
        await updateDoc(projectRef, {
          images: allImages,
          updated_at: new Date(),
        });

        // Update local project state
        if (project.images) {
          project.images = allImages;
        }
      }
    } catch (error) {
      console.error('Error reordering images:', error);
      alert('เกิดข้อผิดพลาดในการเรียงลำดับรูปภาพ กรุณาลองใหม่');
    }
  };

  // Populate form when editing existing project
  useEffect(() => {
    if (project) {
      setFormData({
        width: project.width || 0,
        extension: project.extension || 0,
        description: Array.isArray(project.description) ? project.description : [project.description || ""],
        category: project.category || "",
        location: project.location || "",
        year: project.year || currentYear.toString(),
        type: project.type || "ระบบมือหมุน",
        arms_count: project.arms_count || "2",
        canvas_material: project.canvas_material || "ผ้าอะคริลิคสเปน",
        fabric_edge: project.fabric_edge || "ตัดเรียบ",
        featured_image: project.featured_image,
        slug: project.slug,
        images: project.images || []
      });
    }
  }, [project]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDescriptionChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      description: prev.description.map((desc, i) =>
        i === index ? value : desc
      ),
    }));
  };

  const addDescriptionField = () => {
    setFormData((prev) => ({
      ...prev,
      description: [...prev.description, ""],
    }));
  };

  const removeDescriptionField = (index: number) => {
    if (formData.description.length > 1) {
      setFormData((prev) => ({
        ...prev,
        description: prev.description.filter((_, i) => i !== index),
      }));
    }
  };

  const generateDescription = async () => {
    if (generatingDescription) return;

    // Validate required fields for AI generation
    const validation = validateBasicFields();
    if (!validation.valid) {
      alert(`กรุณากรอกข้อมูลพื้นฐานก่อนใช้ AI:\n${validation.errors.join("\n")}`);
      return;
    }

    // Check if we have images (uploaded or local files)
    const allImages = [...afterImages, ...beforeImages];
    const allLocalFiles = [...localAfterFiles, ...localBeforeFiles];

    if (allImages.length === 0 && allLocalFiles.length === 0) {
      alert("กรุณาเลือกรูปภาพอย่างน้อย 1 รูป เพื่อให้ AI วิเคราะห์");
      return;
    }

    setGeneratingDescription(true);

    try {
      // Convert images to base64
      const base64Images: string[] = [];

      // First, use local files (if any) - they're faster since already on device
      for (const localFile of allLocalFiles.slice(0, 3)) {
        try {
          const base64 = await convertFileToBase64(localFile.file);
          base64Images.push(base64);
        } catch (error) {
          console.warn('Failed to convert local file:', error);
        }
      }

      // If we need more images, fetch from uploaded images
      const remainingSlots = 3 - base64Images.length;
      if (remainingSlots > 0 && allImages.length > 0) {
        for (const image of allImages.slice(0, remainingSlots)) {
          try {
            const response = await fetch(image.original_size);
            const blob = await response.blob();
            const file = new File([blob], 'image.jpg', { type: blob.type });
            const base64 = await convertFileToBase64(file);
            base64Images.push(base64);
          } catch (error) {
            console.warn('Failed to convert uploaded image:', error);
          }
        }
      }

      // Call the AI generation API
      const response = await fetch('/api/genkit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          width: formData.width,
          extension: formData.extension,
          category: formData.category,
          location: formData.location,
          year: formData.year,
          type: formData.type,
          arms_count: formData.arms_count,
          canvas_material: formData.canvas_material,
          fabric_edge: formData.fabric_edge,
          images: base64Images
        }),
      });

      if (!response.ok) {
        throw new Error(`AI generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update form with generated descriptions
      if (result.descriptions && Array.isArray(result.descriptions)) {
        setFormData((prev) => ({
          ...prev,
          description: result.descriptions.filter((desc: string) => desc.trim() !== "")
        }));
        
        alert("✨ สร้างรายละเอียดโปรเจคด้วย AI สำเร็จแล้ว! กรุณาตรวจสอบและแก้ไขตามต้องการ");
      } else {
        throw new Error("Invalid response format from AI");
      }
    } catch (error) {
      console.error('Error generating description:', error);
      alert("เกิดข้อผิดพลาดในการสร้างรายละเอียดด้วย AI กรุณาลองใหม่อีกครั้ง");
    } finally {
      setGeneratingDescription(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:image/...;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const validateBasicFields = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (formData.width <= 0) errors.push("กรุณากรอกความกว้าง");
    if (formData.extension <= 0) errors.push("กรุณากรอกระยะยื่นออก");
    if (!formData.category) errors.push("กรุณาเลือกหมวดหมู่");
    if (!formData.location.trim()) errors.push("กรุณากรอกสถานที่");
    if (!formData.year) errors.push("กรุณาเลือกปี");

    return { valid: errors.length === 0, errors };
  };

  const validateForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (formData.width <= 0) errors.push("กรุณากรอกความกว้าง");
    if (formData.extension <= 0) errors.push("กรุณากรอกระยะยื่นออก");
    if (!formData.category) errors.push("กรุณาเลือกหมวดหมู่");
    if (!formData.location.trim()) errors.push("กรุณากรอกสถานที่");
    if (!formData.year) errors.push("กรุณาเลือกปี");
    if (formData.description.every((desc) => !desc.trim())) {
      errors.push("กรุณากรอกรายละเอียดอย่างน้อย 1 รายการ");
    }

    // Check for images (uploaded + local preview files)
    const hasUploadedImages = afterImages.length > 0 || beforeImages.length > 0;
    const hasLocalFiles = localAfterFiles.length > 0 || localBeforeFiles.length > 0;
    const hasExistingImages = project && project.images && project.images.length > 0;

    if (!hasUploadedImages && !hasLocalFiles && !hasExistingImages) {
      errors.push("กรุณาเลือกรูปภาพอย่างน้อย 1 รูป (หลังติดตั้ง)");
    }

    // Validate that we have at least one "after" image (uploaded or local)
    if ((hasUploadedImages || hasLocalFiles) && afterImages.length === 0 && localAfterFiles.length === 0) {
      errors.push("ต้องมีรูปหลังติดตั้งอย่างน้อย 1 รูป");
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm();
    if (!validation.valid) {
      alert(`กรุณาแก้ไขข้อผิดพลาด:\n${validation.errors.join("\n")}`);
      return;
    }

    setSubmitting(true);
    setIsUploadingImages(true);

    try {
      let finalFormData = { ...formData };

      // Step 1: Upload local files to Cloudflare first
      let uploadedAfterImages: ProjectImage[] = [];
      let uploadedBeforeImages: ProjectImage[] = [];

      if (localAfterFiles.length > 0) {
        uploadedAfterImages = await uploadLocalFilesToCloudflare(
          localAfterFiles,
          'after',
          afterImages.length
        );
      }

      if (localBeforeFiles.length > 0) {
        uploadedBeforeImages = await uploadLocalFilesToCloudflare(
          localBeforeFiles,
          'before',
          beforeImages.length
        );
      }

      // Step 1.5: Upload local video files
      let uploadedVideos: ProjectVideo[] = [];
      if (localVideoFiles.length > 0) {
        for (const localVideo of localVideoFiles) {
          try {
            const result = await uploadVideoToCloudflare(localVideo.file);
            if (result.success) {
              uploadedVideos.push({
                id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                project_id: project?.id || '',
                title: generateTitle(formData.width, formData.extension),
                video_url: result.videoUrl,
                thumbnail_url: result.thumbnailUrl,
                duration: result.duration,
                file_size: result.fileSize,
                mime_type: result.mimeType,
                type: localVideo.type,
                order_index: videos.length + uploadedVideos.length,
                created_at: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error('Error uploading video:', error);
            alert(`ไม่สามารถอัปโหลดวีดีโอได้: ${localVideo.file.name}`);
          }
        }
      }

      setIsUploadingImages(false);

      // Step 2: Combine all images (existing + newly uploaded)
      const allImages = [
        ...afterImages,
        ...uploadedAfterImages,
        ...beforeImages,
        ...uploadedBeforeImages,
      ];

      // Step 2.5: Combine all videos (existing + newly uploaded)
      const allVideos = [...videos, ...uploadedVideos];

      if (allImages.length > 0) {
        // Validate images
        const invalidImages = allImages.filter(img =>
          !img.small_size || !img.original_size
        );

        if (invalidImages.length > 0) {
          console.error('Invalid images detected:', invalidImages);
          alert(`พบรูปภาพที่ไม่สมบูรณ์ ${invalidImages.length} รูป กรุณาลองอัพโหลดใหม่`);
          return;
        }

        // Use first after image as featured image, or first image if no after images
        const featuredImage = afterImages.length > 0
          ? afterImages[0].original_size
          : allImages[0]?.original_size || '';

        finalFormData = {
          ...finalFormData,
          featured_image: featuredImage,
          images: allImages,
          videos: allVideos.length > 0 ? allVideos : undefined, // Add videos if available
        };
      } else if (project && project.images && project.images.length > 0) {
        // Keep existing images when editing and no new images uploaded
        finalFormData = {
          ...finalFormData,
          featured_image: project.featured_image,
          images: project.images,
          videos: allVideos.length > 0 ? allVideos : (project.videos || undefined), // Keep existing or add new videos
        };
      } else {
        // No images, but might have videos
        if (allVideos.length > 0) {
          finalFormData = {
            ...finalFormData,
            videos: allVideos,
          };
        }
      }

      let generatedSlug: string;
      let projectTitle: string;

      if (project) {
        // Keep existing slug and title when editing
        generatedSlug = project.slug;
        projectTitle = project.title;
      } else {
        // Generate new slug and title for new projects
        generatedSlug = generateSlug(finalFormData.width, finalFormData.extension);
        projectTitle = generateTitle(finalFormData.width, finalFormData.extension);
      }

      // Filter out empty descriptions และเพิ่ม title และ slug
      const cleanedFormData = {
        ...finalFormData,
        title: projectTitle,
        slug: generatedSlug,
        description: finalFormData.description.filter(
          (desc) => desc.trim() !== ""
        ),
        updated_at: new Date(),
        ...(project ? {} : { created_at: new Date() }), // Only add created_at for new projects
      };

      // Validate images before saving to Firestore
      if (cleanedFormData.images && cleanedFormData.images.length > 0) {
        const invalidImages = cleanedFormData.images.filter((img: any) => 
          !img.small_size || !img.original_size
        );
        
        if (invalidImages.length > 0) {
          console.error('Invalid images detected:', invalidImages);
          alert(`พบรูปภาพที่ไม่สมบูรณ์ ${invalidImages.length} รูป กรุณาลองอัพโหลดใหม่`);
          return;
        }
        
        // Check for duplicate URLs
        const originalSizes = cleanedFormData.images.map((img: any) => img.original_size);
        const uniqueOriginalSizes = [...new Set(originalSizes)];
        
        if (originalSizes.length !== uniqueOriginalSizes.length) {
          console.error('Duplicate image URLs detected:', originalSizes);
          alert('พบรูปภาพที่มี URL ซ้ำกัน กรุณาลองอัพโหลดใหม่');
          return;
        }
      }

      let docId: string;

      if (project) {
        // Update existing project
        const docRef = doc(db, "projects", project.id);
        await updateDoc(docRef, cleanedFormData);
        docId = project.id;
      } else {
        // Add new project
        const docRef = await addDoc(collection(db, "projects"), cleanedFormData);
        docId = docRef.id;
      }

      setCreatedProjectId(generatedSlug);
      setSuccess(true);

      // Enhanced cache revalidation with tag-based clearing
      try {
        const revalidationPayload = {
          tags: ["projects-data", `project-data-${generatedSlug}`], // Tag-based revalidation
          paths: [
            "/portfolio",
            "/works",
            `/portfolio/${generatedSlug}`,
            `/works/${generatedSlug}`,
          ], // Path-based revalidation
          debug: process.env.NODE_ENV === "development",
          secret: process.env.REVALIDATION_SECRET_TOKEN,
        };

        const revalidateResponse = await fetch("/api/revalidate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(revalidationPayload),
        });

        if (!revalidateResponse.ok) {
          const errorData = await revalidateResponse.json();
          console.error("❌ Revalidation failed:", errorData);
          setRevalidationStatus({
            completed: true,
            success: false,
            details: errorData,
          });
        } else {
          const result = await revalidateResponse.json();
          setRevalidationStatus({
            completed: true,
            success: true,
            details: result,
          });
        }
      } catch (revalidateError) {
        console.error("❌ Failed to revalidate cache:", revalidateError);
        setRevalidationStatus({
          completed: true,
          success: false,
          details: {
            error:
              revalidateError instanceof Error
                ? revalidateError.message
                : "Unknown error",
          },
        });
        // Don't fail the whole operation if revalidation fails
        alert("⚠️ โปรเจคถูกบันทึกแล้ว แต่อาจต้องรอสักครู่เพื่อให้ข้อมูลอัปเดต");
      }

      // Call success callback if provided (for admin panel)
      if (onSuccess) {
        onSuccess();
        return;
      }

      // Only reset form for new projects (not when editing)
      if (!project) {
        setFormData({
          width: 0,
          extension: 0,
          description: [""],
          category: "",
          location: "",
          year: currentYear.toString(),
          type: "ระบบมือหมุน",
          arms_count: "2",
          canvas_material: "ผ้าอะคริลิคสเปน",
          fabric_edge: "ตัดเรียบ",
          images: [],
        });

        // Reset Before/After images state
        setAfterImages([]);
        setBeforeImages([]);

        // Reset local preview files and revoke blob URLs
        localAfterFiles.forEach(file => URL.revokeObjectURL(file.preview));
        localBeforeFiles.forEach(file => URL.revokeObjectURL(file.preview));
        setLocalAfterFiles([]);
        setLocalBeforeFiles([]);
      }

      // Hide success message after 10 seconds
      setTimeout(() => {
        setSuccess(false);
        setCreatedProjectId(null);
        setRevalidationStatus(null);
      }, 10000);
    } catch (error) {
      console.error("Error adding project: ", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";
  const textareaClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm leading-relaxed text-gray-900 transition-colors focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 min-h-[120px]";

  return (
    <div className="mx-auto w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
      {success && (
        <div className="mb-6 space-y-3">
          <div className="rounded-lg border border-gray-300 bg-white px-4 py-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-4 w-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-sm leading-relaxed text-gray-900">
                  <p className="font-semibold">บันทึกโปรเจคเรียบร้อยแล้ว</p>
                  <p className="text-gray-600">ตรวจสอบบนหน้าเว็บไซต์เพื่อดูการอัปเดตล่าสุด</p>
                </div>
              </div>
              {createdProjectId && (
                <div className="flex w-full flex-col gap-2 text-sm sm:w-auto sm:flex-row">
                  <a
                    href={`/portfolio/${createdProjectId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-white transition-colors hover:bg-gray-800"
                  >
                    เปิดหน้าโปรเจค
                  </a>
                  <a
                    href="/portfolio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    ดูผลงานทั้งหมด
                  </a>
                </div>
              )}
            </div>
          </div>

          {revalidationStatus && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white border border-gray-300 text-[10px] font-semibold text-gray-600">
                  i
                </span>
                <div className="space-y-0.5">
                  <p className="font-medium text-gray-900">
                    {revalidationStatus.success ? "อัปเดตแคชสำเร็จ" : "ไม่สามารถอัปเดตแคช"}
                  </p>
                  {revalidationStatus.success ? (
                    <p className="text-xs text-gray-600">
                      โปรเจคจะแสดงในเว็บไซต์ทันที ({revalidationStatus.details?.executionTime}ms)
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600">
                      โปรเจคอาจใช้เวลาสักครู่ก่อนจะแสดงบนเว็บไซต์
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden w-full rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {project ? "แก้ไขโปรเจค" : "เพิ่มโปรเจคใหม่"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">กรอกข้อมูลหลักและแนบรูปภาพการทำงาน</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-8">
          {/* PDF Autofill Section */}
          {/* {!project && (
            <PDFAutofillComponent 
              onDataExtracted={handlePDFAutofillData}
              isLoading={submitting}
            />
          )} */}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                ขนาด *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="width"
                    className="block text-xs font-medium text-gray-700 mb-1.5"
                  >
                    กว้าง (เมตร)
                  </label>
                  <input
                    type="number"
                    id="width"
                    name="width"
                    value={formData.width || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, width: Number(e.target.value) || 0 }))}
                    required
                    min="0"
                    step="0.1"
                    className={inputClass}
                    placeholder="เช่น 3.5"
                  />
                </div>
                <div>
                  <label
                    htmlFor="extension"
                    className="block text-xs font-medium text-gray-700 mb-1.5"
                  >
                    ยื่นออก (เมตร)
                  </label>
                  <input
                    type="number"
                    id="extension"
                    name="extension"
                    value={formData.extension || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, extension: Number(e.target.value) || 0 }))}
                    required
                    min="0"
                    step="0.1"
                    className={inputClass}
                    placeholder="เช่น 2.0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                หมวดหมู่ *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className={inputClass}
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option  key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                สถานที่ *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className={inputClass}
                placeholder="เช่น กรุงเทพฯ, ชลบุรี"
              />
            </div>

            <div>
              <label
                htmlFor="year"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                ปีที่ดำเนินการ *
              </label>
              <select
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className={inputClass}
              >
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* System Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ประเภทระบบ *
            </label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="type"
                  value="ระบบมือหมุน"
                  checked={formData.type === "ระบบมือหมุน"}
                  onChange={handleInputChange}
                  className="h-4 w-4 accent-gray-900"
                />
                <span className="ml-3 flex-1">ระบบมือหมุน</span>
              </label>
              <label className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="type"
                  value="มอเตอร์ไฟฟ้า"
                  checked={formData.type === "มอเตอร์ไฟฟ้า"}
                  onChange={handleInputChange}
                  className="h-4 w-4 accent-gray-900"
                />
                <span className="ml-3 flex-1">มอเตอร์ไฟฟ้า</span>
              </label>
              <label className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="type"
                  value="สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)"
                  checked={formData.type === "สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)"}
                  onChange={handleInputChange}
                  className="h-4 w-4 accent-gray-900"
                />
                <span className="ml-3 flex-1">สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)</span>
              </label>
            </div>
          </div>

          {/* Additional Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label
                htmlFor="arms_count"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                จำนวนแขนพับ *
              </label>
              <select
                id="arms_count"
                name="arms_count"
                value={formData.arms_count}
                onChange={handleInputChange}
                required
                className={inputClass}
              >
                <option value="2">2 แขน</option>
                <option value="3">3 แขน</option>
                <option value="4">4 แขน</option>
                <option value="5">5 แขน</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="canvas_material"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                วัสดุผ้าใบ *
              </label>
              <select
                id="canvas_material"
                name="canvas_material"
                value={formData.canvas_material}
                onChange={handleInputChange}
                required
                className={inputClass}
              >
                <option value="ผ้าอะคริลิคสเปน">ผ้าอะคริลิคสเปน</option>
                <option value="ผ้าอะคริลิค">ผ้าอะคริลิค</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="fabric_edge"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                ชายผ้า *
              </label>
              <select
                id="fabric_edge"
                name="fabric_edge"
                value={formData.fabric_edge}
                onChange={handleInputChange}
                required
                className={inputClass}
              >
                <option value="ตัดเรียบ">ตัดเรียบ</option>
                <option value="โค้งลอน">โค้งลอน</option>
                <option value="ตัดเรียบ + พิมพ์ Logo">ตัดเรียบ + พิมพ์ Logo</option>
                <option value="โค้งลอน + พิมพ์ Logo">โค้งลอน + พิมพ์ Logo</option>
              </select>
            </div>
          </div>


          {/* Image Upload - Tabs for Before/After */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              รูปภาพโปรเจค *
            </label>

            <MediaUploadTabs
              afterImages={afterImages}
              beforeImages={beforeImages}
              localAfterFiles={localAfterFiles}
              localBeforeFiles={localBeforeFiles}
              videos={videos}
              localVideoFiles={localVideoFiles}
              onAfterImagesChange={setAfterImages}
              onBeforeImagesChange={setBeforeImages}
              onLocalAfterFilesChange={setLocalAfterFiles}
              onLocalBeforeFilesChange={setLocalBeforeFiles}
              onVideosChange={setVideos}
              onLocalVideoFilesChange={setLocalVideoFiles}
              onImageDelete={handleTabImageDelete}
              onImageReorder={handleTabImageReorder}
              onVideoDelete={handleVideoDelete}
              onVideoTypeChange={handleVideoTypeChange}
              isUploading={isUploadingImages}
            />
          </div>

          {/* Description Section - Moved to Bottom */}
          <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-base font-semibold text-gray-900">
                รายละเอียดโปรเจค *
              </label>
              {/* TODO: Enable when AI system is ready */}
              {/* <button
                type="button"
                onClick={generateDescription}
                disabled={generatingDescription}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                {generatingDescription ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังสร้างด้วย AI...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    ✨ Gen with AI
                  </>
                )}
              </button> */}
            </div>

            {/* TODO: Enable when AI system is ready */}
            {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 text-sm">
                  <p className="text-blue-800 font-medium">
                    วิธีใช้ AI สร้างรายละเอียด:
                  </p>
                  <p className="text-blue-700 mt-1">
                    1. กรอกข้อมูลพื้นฐาน (ขนาด, ประเภท, สถานที่) ให้ครบ
                    <br />
                    2. เลือกรูปภาพโปรเจคอย่างน้อย 1 รูป
                    <br />
                    3. คลิก &ldquo;✨ Gen with AI&rdquo; เพื่อให้ AI วิเคราะห์และสร้างรายละเอียดอัตโนมัติ
                  </p>
                </div>
              </div>
            </div> */}

            <div className="space-y-3">
              {formData.description.map((desc, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={desc}
                    onChange={(e) =>
                      handleDescriptionChange(index, e.target.value)
                    }
                    rows={12}
                    className={`${textareaClass} flex-1 resize-none`}
                    placeholder={`รายละเอียดที่ ${index + 1}`}
                  />
                  {formData.description.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDescriptionField(index)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addDescriptionField}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12m6-6H6" />
                </svg>
                เพิ่มรายละเอียด
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-8 py-3 text-base font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto shadow-sm"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  กำลังอัพโหลดและบันทึก...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {project ? 'อัปเดตโปรเจค' : 'บันทึกโปรเจค'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
