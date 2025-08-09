
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, addDoc, query, where, orderBy, limit } from 'firebase/firestore';

// Database Types (These can be moved to a separate types file if needed)
export interface Project {
  id: string; // Firestore uses string IDs
  title: string; // Generated from width x extension
  width: number;
  extension: number;
  description: string[] | string;
  category: string;
  location: string;
  year: string;
  type: 'ระบบมือหมุน' | 'มอเตอร์ไฟฟ้า' | 'สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)';
  arms_count: '2' | '3' | '4' | '5'; // จำนวนแขนพับ
  canvas_material: 'ผ้าอะคริลิคสเปน' | 'ผ้าอะคริลิค'; // วัสดุผ้าใบ
  fabric_edge: 'ตัดเรียบ' | 'โค้งลอน' | 'ตัดเรียบ + พิมพ์ Logo' | 'โค้งลอน + พิมพ์ Logo'; // ชายผ้า
  featured_image?: string;
  images: ProjectImage[];
  created_at?: string | any; // ISO string when serialized, Firestore timestamp on server
  updated_at?: string | any; // ISO string when serialized, Firestore timestamp on server
  slug: string;
  timeline?: ProjectTimeline[];
  testimonial?: ProjectTestimonial;
  technicalSpecs?: ProjectTechnicalSpecs;
  relatedProjects?: string[]; // Array of project IDs
  client?: string;
  completionDate?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export interface ProjectTimeline {
  id: string;
  phase: string;
  description: string;
  images: string[];
  date?: string;
  order_index: number;
}

export interface ProjectTestimonial {
  quote: string;
  clientName: string;
  position?: string;
  company?: string;
  rating?: number;
  date?: string;
}

export interface ProjectTechnicalSpecs {
  materials: string[];
  dimensions: string;
  installation: string;
  warranty: string;
  features?: string[];
  certifications?: string[];
}

export interface ProjectImage {
  id: string; // Firestore uses string IDs
  project_id: string;
  title: string;
  description?: string;
  small_size: string;
  medium_size?: string;
  original_size: string;
  alt_text?: string;
  order_index: number;
  type?: 'before' | 'during' | 'after' | 'detail';
  caption?: string;
  created_at?: string | any; // ISO string when serialized, Firestore timestamp on server
}

export interface Article {
  id: string; // Firestore uses string IDs
  title: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  category: string;
  author: string;
  published_at: string | any; // ISO string when serialized, Firestore timestamp on server
  read_time: string;
  tags: string[];
  slug: string;
  created_at?: string | any; // ISO string when serialized, Firestore timestamp on server
  updated_at?: string | any; // ISO string when serialized, Firestore timestamp on server
}

export interface Category {
  id: string; // Firestore uses string IDs
  name: string;
  slug: string;
  description?: string;
  type: 'project' | 'article';
  created_at?: string | any; // ISO string when serialized, Firestore timestamp on server
}

export interface ContactSubmission {
  id: string; // Firestore uses string IDs
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: 'new' | 'contacted' | 'completed';
  created_at?: string | any; // ISO string when serialized, Firestore timestamp on server
}

// Database Functions
export const projectsService = {
  // Get all projects
  async getAll() {
    try {
      const projectsCol = collection(db, 'projects');
      const q = query(projectsCol, orderBy('created_at', 'desc'));
      const projectSnapshot = await getDocs(q);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      return projectList;
    } catch (error) {
      console.error('Firestore getAll error:', error);
      throw new Error(`Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get project by ID
  async getById(id: string) {
    try {
      const projectDoc = doc(db, 'projects', id);
      const projectSnapshot = await getDoc(projectDoc);
      if (!projectSnapshot.exists()) {
        return null;
      }
      return { id: projectSnapshot.id, ...projectSnapshot.data() } as Project;
    } catch (error) {
      console.error('Firestore getById error:', error);
      throw new Error(`Failed to fetch project ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get projects by category
  async getByCategory(category: string) {
    try {
      const projectsCol = collection(db, 'projects');
      const q = query(projectsCol, where('category', '==', category), orderBy('created_at', 'desc'));
      const projectSnapshot = await getDocs(q);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      return projectList;
    } catch (error) {
      console.error('Firestore getByCategory error:', error);
      throw new Error(`Failed to fetch projects by category ${category}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get project by slug
  async getBySlug(slug: string) {
    try {
      const projectsCol = collection(db, 'projects');
      const q = query(projectsCol, where('slug', '==', slug));
      const projectSnapshot = await getDocs(q);
      if (projectSnapshot.empty) {
        return null;
      }
      const doc = projectSnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Project;
    } catch (error) {
      console.error('Firestore getBySlug error:', error);
      throw new Error(`Failed to fetch project by slug ${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get related projects by IDs
  async getRelatedProjects(projectIds: string[]) {
    try {
      if (projectIds.length === 0) return [];
      
      const projectsCol = collection(db, 'projects');
      const projectPromises = projectIds.map(id => 
        getDoc(doc(db, 'projects', id))
      );
      
      const projectSnapshots = await Promise.all(projectPromises);
      const projects = projectSnapshots
        .filter(snapshot => snapshot.exists())
        .map(snapshot => ({ id: snapshot.id, ...snapshot.data() } as Project));
      
      return projects;
    } catch (error) {
      console.error('Firestore getRelatedProjects error:', error);
      return [];
    }
  }
}

export const articlesService = {
  // Get all articles
  async getAll() {
    const articlesCol = collection(db, 'articles');
    const q = query(articlesCol, where('published_at', '!=', null), orderBy('published_at', 'desc'));
    const articleSnapshot = await getDocs(q);
    const articleList = articleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
    return articleList;
  },

  // Get article by slug
  async getBySlug(slug: string) {
    const articlesCol = collection(db, 'articles');
    const q = query(articlesCol, where('slug', '==', slug));
    const articleSnapshot = await getDocs(q);
    if (articleSnapshot.empty) {
      return null;
    }
    const doc = articleSnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Article;
  },

  // Get articles by category
  async getByCategory(category: string) {
    const articlesCol = collection(db, 'articles');
    const q = query(articlesCol, where('category', '==', category), where('published_at', '!=', null), orderBy('published_at', 'desc'));
    const articleSnapshot = await getDocs(q);
    const articleList = articleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
    return articleList;
  }
}

export const contactService = {
  // Submit contact form
  async submit(submission: Omit<ContactSubmission, 'id' | 'status' | 'created_at'>) {
    const contactSubmissionsCol = collection(db, 'contact_submissions');
    const docRef = await addDoc(contactSubmissionsCol, {
      ...submission,
      status: 'new',
      created_at: new Date(),
    });
    return { id: docRef.id, ...submission, status: 'new' } as ContactSubmission;
  }
}
