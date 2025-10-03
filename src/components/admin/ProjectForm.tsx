"use client";

import { useState, useRef, useEffect } from "react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { UploadResult } from "../../app/lib/cloudflare/uploadImage";
import ImageUpload, { ImageUploadRef } from "./ImageUpload";
import ImageUploadTabs from "./ImageUploadTabs";
import { Project, ProjectImage } from "../../lib/firestore";
import { getAfterImages, getBeforeImages } from "../../lib/project-image-utils";
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
  images: Array<{
    original_size: string;
    alt_text: string;
    title: string;
    order_index: number;
  }>;
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

  const [uploadedImages, setUploadedImages] = useState<UploadResult[]>([]);
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
  const imageUploadRef = useRef<ImageUploadRef>(null);

  // Separate state for Before/After images
  const [afterImages, setAfterImages] = useState<ProjectImage[]>([]);
  const [beforeImages, setBeforeImages] = useState<ProjectImage[]>([]);

  // Initialize before/after images when project is loaded
  useEffect(() => {
    if (project && project.images) {
      setAfterImages(getAfterImages(project));
      setBeforeImages(getBeforeImages(project));
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

    // Show success message or notification
    console.log('PDF data extracted and form updated:', data);
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

      console.log('Image deleted successfully');

    } catch (error) {
      console.error('Error deleting image:', error);
      alert('เกิดข้อผิดพลาดในการลบรูปภาพ กรุณาลองใหม่');
    } finally {
      setDeletingImageIndex(null);
    }
  };

  // Handler for ImageUploadTabs - Upload images
  const handleTabImageUpload = async (files: FileList, type: 'before' | 'after') => {
    setIsUploadingImages(true);
    try {
      // Convert FileList to array for processing
      const filesArray = Array.from(files);

      // Upload to Cloudflare (reuse existing logic)
      const uploadPromises = filesArray.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        return await response.json();
      });

      const uploadResults: UploadResult[] = await Promise.all(uploadPromises);

      // Convert to ProjectImage format
      const newImages: ProjectImage[] = uploadResults.map((result, index) => ({
        id: `${Date.now()}-${index}`,
        project_id: project?.id || '',
        small_size: result.thumbnailUrl || result.mediumUrl || result.originalUrl || '',
        medium_size: result.mediumUrl || result.originalUrl || result.thumbnailUrl || '',
        original_size: result.originalUrl || result.mediumUrl || result.thumbnailUrl || '',
        alt_text: `กันสาดพับได้ ${generateTitle(formData.width, formData.extension)} - ${type === 'after' ? 'หลังติดตั้ง' : 'ก่อนติดตั้ง'} รูปที่ ${index + 1}`,
        title: `กันสาดพับได้ ${generateTitle(formData.width, formData.extension)}`,
        caption: '',
        type: type,
        order_index: (type === 'after' ? afterImages.length : beforeImages.length) + index,
      }));

      // Update state based on type
      if (type === 'after') {
        const updatedAfterImages = [...afterImages, ...newImages];
        setAfterImages(updatedAfterImages);

        // Update featured_image if this is the first after image
        if (afterImages.length === 0 && newImages.length > 0) {
          setFormData(prev => ({
            ...prev,
            featured_image: newImages[0].original_size,
          }));
        }
      } else {
        const updatedBeforeImages = [...beforeImages, ...newImages];
        setBeforeImages(updatedBeforeImages);
      }

      // Update Firestore if editing existing project
      if (project && project.id) {
        const allImages = [...afterImages, ...beforeImages, ...newImages];
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
      console.error('Error uploading images:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ กรุณาลองใหม่');
    } finally {
      setIsUploadingImages(false);
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
        images: project.images?.map((img, idx) => ({
          original_size: img.original_size,
          alt_text: img.alt_text || `${project.title} - รูปที่ ${idx + 1}`,
          title: img.title,
          order_index: img.order_index
        })) || []
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

    const selectedFiles = imageUploadRef.current?.getSelectedFiles() || [];
    if (selectedFiles.length === 0 && uploadedImages.length === 0) {
      alert("กรุณาเลือกรูปภาพอย่างน้อย 1 รูป เพื่อให้ AI วิเคราะห์");
      return;
    }

    setGeneratingDescription(true);
    
    try {
      // Convert images to base64
      const images = selectedFiles.length > 0 ? selectedFiles : uploadedImages;
      const base64Images: string[] = [];
      
      for (const image of images.slice(0, 3)) { // Limit to 3 images for API efficiency
        if ('file' in image) {
          // Handle SelectedFile
          const base64 = await convertFileToBase64(image.file);
          base64Images.push(base64);
        } else {
          // Handle UploadResult - need to fetch the image and convert
          try {
            const response = await fetch(image.originalUrl || image.mediumUrl || image.thumbnailUrl || '');
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

  const handleImageUpload = (results: UploadResult[]) => {
    // Validate all uploads have at least one URL
    const failedUploads = results.filter((result, index) => 
      !result.thumbnailUrl && !result.mediumUrl && !result.originalUrl
    );
    
    if (failedUploads.length > 0) {
      console.error('Some image uploads completely failed:', failedUploads);
      alert(`เกิดข้อผิดพลาดในการอัพโหลด ${failedUploads.length} รูป กรุณาลองใหม่`);
      return;
    }
    
    // Log warnings for partial failures
    results.forEach((result, index) => {
      if (!result.thumbnailUrl) console.warn(`Missing thumbnailUrl for image ${index + 1}`);
      if (!result.mediumUrl) console.warn(`Missing mediumUrl for image ${index + 1}`);
      if (!result.originalUrl) console.warn(`Missing originalUrl for image ${index + 1}`);
    });
    
    setUploadedImages(results);

    // Convert to project image format with flexible size mapping
    const projectImages = results.map((result, index) => ({
      small_size: result.thumbnailUrl || result.mediumUrl || result.originalUrl || '',
      medium_size: result.mediumUrl || result.originalUrl || result.thumbnailUrl || '',
      original_size: result.originalUrl || result.mediumUrl || result.thumbnailUrl || '',
      alt_text: `กันสาดพับได้ ${generateTitle(formData.width, formData.extension)} - กันสาดพับเก็บได้ รูปที่ ${index + 1}`,
      title: `กันสาดพับได้ ${generateTitle(formData.width, formData.extension)} - กันสาดพับเก็บได้`,
      order_index: index,
    }));

    setFormData((prev) => ({
      ...prev,
      featured_image: results[0]?.originalUrl || results[0]?.mediumUrl || results[0]?.thumbnailUrl || '',
      images: projectImages,
    }));
  };

  const validateForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const selectedFiles = imageUploadRef.current?.getSelectedFiles() || [];

    if (formData.width <= 0) errors.push("กรุณากรอกความกว้าง");
    if (formData.extension <= 0) errors.push("กรุณากรอกระยะยื่นออก");
    if (!formData.category) errors.push("กรุณาเลือกหมวดหมู่");
    if (!formData.location.trim()) errors.push("กรุณากรอกสถานที่");
    if (!formData.year) errors.push("กรุณาเลือกปี");
    if (formData.description.every((desc) => !desc.trim())) {
      errors.push("กรุณากรอกรายละเอียดอย่างน้อย 1 รายการ");
    }
    // Only require images for new projects or if editing a project without existing images
    const hasExistingImages = project && project.images && project.images.length > 0;
    if (selectedFiles.length === 0 && uploadedImages.length === 0 && !hasExistingImages) {
      errors.push("กรุณาเลือกรูปภาพอย่างน้อย 1 รูป");
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

    try {
      let finalFormData = { ...formData };

      // Upload images if there are selected files
      const selectedFiles = imageUploadRef.current?.getSelectedFiles() || [];
      if (selectedFiles.length > 0) {
        try {
          const uploadResults = await imageUploadRef.current?.uploadFiles();
          if (uploadResults && uploadResults.length > 0) {
            // Convert to project image format with proper size mapping and validation
            const projectImages = uploadResults.map((result, index) => {
              console.log(`🖼️ Upload result ${index + 1}:`, {
                thumbnailUrl: result.thumbnailUrl,
                mediumUrl: result.mediumUrl,
                originalUrl: result.originalUrl
              });
              
              // Validate that we have at least one URL (preferably original or medium)
              if (!result.originalUrl && !result.mediumUrl && !result.thumbnailUrl) {
                console.error(`❌ Image ${index + 1} validation failed - no URLs:`, result);
                throw new Error(`Image ${index + 1}: No valid URLs found`);
              }
              
              // Log warning if missing expected URLs
              if (!result.thumbnailUrl) {
                console.warn(`⚠️ Image ${index + 1}: Missing thumbnailUrl`);
              }
              if (!result.originalUrl) {
                console.warn(`⚠️ Image ${index + 1}: Missing originalUrl`);
              }
              
              const imageData = {
                small_size: result.thumbnailUrl || result.mediumUrl || result.originalUrl || '',
                medium_size: result.mediumUrl || result.originalUrl || result.thumbnailUrl || '',
                original_size: result.originalUrl || result.mediumUrl || result.thumbnailUrl || '',
                alt_text: `กันสาดพับได้ ${generateTitle(formData.width, formData.extension)} - กันสาดพับเก็บได้ รูปที่ ${index + 1}`,
                title: `กันสาดพับได้ ${generateTitle(formData.width, formData.extension)} - กันสาดพับเก็บได้`,
                order_index: index,
              };
              
              console.log(`✅ Created image data ${index + 1}:`, imageData);
              return imageData;
            });

            finalFormData = {
              ...finalFormData,
              featured_image: uploadResults[0]?.originalUrl || uploadResults[0]?.mediumUrl || uploadResults[0]?.thumbnailUrl || '', // First image as featured
              images: projectImages,
            };
          }
        } catch (uploadError) {
          console.error("Error uploading images:", uploadError);
          alert("เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ");
          return;
        }
      } else if (uploadedImages.length > 0) {
        // Use already uploaded images with proper size mapping and validation
        const projectImages = uploadedImages.map((result, index) => {
          // Validate that we have all required URLs
          if (!result.thumbnailUrl || !result.originalUrl) {
            throw new Error(`Image ${index + 1}: Missing required thumbnailUrl or originalUrl`);
          }
          
          return {
            small_size: result.thumbnailUrl,
            medium_size: result.mediumUrl || result.originalUrl, // Fallback to original if medium missing
            original_size: result.originalUrl,
            alt_text: `กันสาดพับได้ ${generateTitle(formData.width, formData.extension)} - กันสาดพับเก็บได้ รูปที่ ${index + 1}`,
            title: `กันสาดพับได้ ${generateTitle(formData.width, formData.extension)} - กันสาดพับเก็บได้`,
            order_index: index,
          };
        });

        finalFormData = {
          ...finalFormData,
          featured_image: uploadedImages[0]?.originalUrl || uploadedImages[0]?.mediumUrl || uploadedImages[0]?.thumbnailUrl,
          images: projectImages,
        };
      } else if (project && project.images && project.images.length > 0) {
        // Keep existing images when editing and no new images uploaded
        finalFormData = {
          ...finalFormData,
          featured_image: project.featured_image,
          images: project.images.map(img => ({
            original_size: img.original_size,
            alt_text: img.alt_text || `${project.title} - รูปโปรเจค`,
            title: img.title,
            order_index: img.order_index
          })),
        };
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
        console.log("✅ Project updated with ID: ", project.id, "slug:", generatedSlug);
      } else {
        // Add new project
        const docRef = await addDoc(collection(db, "projects"), cleanedFormData);
        docId = docRef.id;
        console.log("✅ Project added with ID: ", docRef.id, "slug:", generatedSlug);
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

        console.log("🔄 Starting cache revalidation...", revalidationPayload);

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
          console.log("✅ Cache revalidation completed:", result);
          setRevalidationStatus({
            completed: true,
            success: true,
            details: result,
          });

          // Show detailed revalidation results in development
          if (process.env.NODE_ENV === "development") {
            console.log("📊 Revalidation Details:", {
              executionTime: result.executionTime,
              operations: result.operations,
              tags: result.tags,
              paths: result.paths,
            });
          }
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
        setUploadedImages([]);

        // Reset image upload component
        imageUploadRef.current?.reset();
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
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {success && (
        <div className="mb-6 space-y-4">
          {/* Main Success Message */}
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-medium">บันทึกโปรเจคเรียบร้อยแล้ว!</span>
              </div>
              {createdProjectId && (
                <div className="flex gap-3">
                  <a
                    href={`/portfolio/${createdProjectId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    ดูโปรเจค
                  </a>
                  <a
                    href="/portfolio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-green-600 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 hover:text-white transition-colors flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0l-4-4m4 4l-4 4"
                      />
                    </svg>
                    ดูผลงานทั้งหมด
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Cache Revalidation Status */}
          {revalidationStatus && (
            <div
              className={`border px-4 py-3 rounded-lg ${
                revalidationStatus.success
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-yellow-50 border-yellow-200 text-yellow-700"
              }`}
            >
              <div className="flex items-start">
                {revalidationStatus.success ? (
                  <svg
                    className="w-4 h-4 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                )}
                <div className="flex-1 text-sm">
                  <span className="font-medium">
                    {revalidationStatus.success
                      ? "Cache อัปเดตสำเร็จ"
                      : "Cache อัปเดตล้มเหลว"}
                  </span>
                  {revalidationStatus.details && (
                    <div className="mt-1">
                      {revalidationStatus.success ? (
                        <div className="space-y-1">
                          <p>
                            โปรเจคจะแสดงในเว็บไซต์ทันที (
                            {revalidationStatus.details.executionTime}ms)
                          </p>
                          {process.env.NODE_ENV === "development" &&
                            revalidationStatus.details.operations && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                                  ดูรายละเอียด Cache Revalidation
                                </summary>
                                <div className="mt-2 p-2 bg-blue-100 rounded text-xs font-mono">
                                  <div>
                                    Tags:{" "}
                                    {revalidationStatus.details.tags?.join(
                                      ", "
                                    ) || "None"}
                                  </div>
                                  <div>
                                    Paths:{" "}
                                    {revalidationStatus.details.paths?.join(
                                      ", "
                                    ) || "None"}
                                  </div>
                                  <div>
                                    Operations:{" "}
                                    {revalidationStatus.details.operations
                                      ?.length || 0}
                                  </div>
                                  {revalidationStatus.details.operations?.map(
                                    (op: any, idx: number) => (
                                      <div key={idx} className="ml-2">
                                        {op.type}: {op.target} (
                                        {op.success ? "✅" : "❌"}){" "}
                                        {op.executionTime}ms
                                      </div>
                                    )
                                  )}
                                </div>
                              </details>
                            )}
                        </div>
                      ) : (
                        <p>โปรเจคอาจใช้เวลาสักครู่ก่อนจะแสดงในเว็บไซต์</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4">
          <h1 className="text-2xl font-bold">
            {project ? 'แก้ไขโปรเจค' : 'เพิ่มโปรเจคใหม่'}
          </h1>
          <p className="text-blue-100 mt-1">กรอกข้อมูลโปรเจคและอัพโหลดรูปภาพ</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* PDF Autofill Section */}
          {/* {!project && (
            <PDFAutofillComponent 
              onDataExtracted={handlePDFAutofillData}
              isLoading={submitting}
            />
          )} */}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ขนาด *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="width"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    กว้าง (เมตร)
                  </label>
                  <input
                    type="number"
                    id="width"
                    name="width"
                    value={formData.width || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, width: Number(e.target.value) || 0 }))}
                    required
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="เช่น 3.5"
                  />
                </div>
                <div>
                  <label
                    htmlFor="extension"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    ยื่นออก (เมตร)
                  </label>
                  <input
                    type="number"
                    id="extension"
                    name="extension"
                    value={formData.extension || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, extension: Number(e.target.value) || 0 }))}
                    required
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="เช่น 2.0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                หมวดหมู่ *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-2"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="เช่น กรุงเทพฯ, ชลบุรี"
              />
            </div>

            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ปีที่ดำเนินการ *
              </label>
              <select
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            <div className="flex flex-col gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="ระบบมือหมุน"
                  checked={formData.type === "ระบบมือหมุน"}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span>ระบบมือหมุน</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="มอเตอร์ไฟฟ้า"
                  checked={formData.type === "มอเตอร์ไฟฟ้า"}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span>มอเตอร์ไฟฟ้า</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)"
                  checked={formData.type === "สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)"}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span>สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)</span>
              </label>
            </div>
          </div>

          {/* Additional Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="arms_count"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                จำนวนแขนพับ *
              </label>
              <select
                id="arms_count"
                name="arms_count"
                value={formData.arms_count}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                วัสดุผ้าใบ *
              </label>
              <select
                id="canvas_material"
                name="canvas_material"
                value={formData.canvas_material}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ผ้าอะคริลิคสเปน">ผ้าอะคริลิคสเปน</option>
                <option value="ผ้าอะคริลิค">ผ้าอะคริลิค</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="fabric_edge"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ชายผ้า *
              </label>
              <select
                id="fabric_edge"
                name="fabric_edge"
                value={formData.fabric_edge}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

            {project && project.id ? (
              <ImageUploadTabs
                afterImages={afterImages}
                beforeImages={beforeImages}
                onAfterImagesChange={setAfterImages}
                onBeforeImagesChange={setBeforeImages}
                onImageUpload={handleTabImageUpload}
                onImageDelete={handleTabImageDelete}
                onImageReorder={handleTabImageReorder}
                isUploading={isUploadingImages}
              />
            ) : (
              <ImageUpload
                ref={imageUploadRef}
                onUpload={handleImageUpload}
                maxFiles={10}
                showUploadArea={true}
              />
            )}
          </div>

          {/* Description Section - Moved to Bottom */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-lg font-semibold text-gray-800">
                รายละเอียดโปรเจค *
              </label>
              <button
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
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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
            </div>

            <div className="space-y-3">
              {formData.description.map((desc, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={desc}
                    onChange={(e) =>
                      handleDescriptionChange(index, e.target.value)
                    }
                    rows={3}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder={`รายละเอียดที่ ${index + 1} (ใช้ AI หรือพิมพ์เอง)`}
                  />
                  {formData.description.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDescriptionField(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
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
                className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                เพิ่มรายละเอียด
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                      strokeWidth={2}
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
