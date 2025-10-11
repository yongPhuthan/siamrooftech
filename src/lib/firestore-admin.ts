import { adminDb } from './firebase-admin';
import admin from './firebase-admin';
import { Project, Article } from './firestore';

// Helper function to serialize Firestore documents for Client Components
function serializeProject(projectData: any): Project {
  const serialized = { ...projectData };
  
  // Convert Firestore timestamps to ISO strings
  if (serialized.created_at && serialized.created_at._seconds) {
    serialized.created_at = new Date(serialized.created_at._seconds * 1000).toISOString();
  }
  if (serialized.updated_at && serialized.updated_at._seconds) {
    serialized.updated_at = new Date(serialized.updated_at._seconds * 1000).toISOString();
  }
  
  return serialized as Project;
}

function serializeArticle(articleData: any): Article {
  const serialized = { ...articleData };
  
  // Convert Firestore timestamps to ISO strings
  if (serialized.created_at && serialized.created_at._seconds) {
    serialized.created_at = new Date(serialized.created_at._seconds * 1000).toISOString();
  }
  if (serialized.updated_at && serialized.updated_at._seconds) {
    serialized.updated_at = new Date(serialized.updated_at._seconds * 1000).toISOString();
  }
  if (serialized.published_at && serialized.published_at._seconds) {
    serialized.published_at = new Date(serialized.published_at._seconds * 1000).toISOString();
  }
  
  return serialized as Article;
}

// Fallback data for when Firebase Admin is not available
const fallbackProjects: Project[] = [
  {
    id: 'fallback-1',
    title: '3.5 x 2.0',
    width: 3.5,
    extension: 2.0,
    description: ['กันสาดพับเก็บได้สำหรับร้านอาหาร ระบบมือหมุน ใช้งานง่าย ประหยัดพื้นที่'],
    category: 'ร้านอาหาร',
    location: 'กรุงเทพฯ',
    year: '2024',
    type: 'ระบบมือหมุน',
    arms_count: '2',
    canvas_material: 'ผ้าอะคริลิคสเปน',
    fabric_edge: 'ตัดเรียบ',
    featured_image: '/images/default-project.jpg',
    images: [],
    slug: '3-5x2-0-100001'
  },
  {
    id: 'fallback-2',
    title: '4.0 x 2.5',
    width: 4.0,
    extension: 2.5,
    description: ['กันสาดพับเก็บได้สำหรับคาเฟ่ ระบบมอเตอร์ไฟฟ้า ควบคุมด้วยรีโมท'],
    category: 'คาเฟ่',
    location: 'ชลบุรี',
    year: '2024',
    type: 'มอเตอร์ไฟฟ้า',
    arms_count: '3',
    canvas_material: 'ผ้าอะคริลิค',
    fabric_edge: 'โค้งลอน',
    featured_image: '/images/default-project.jpg',
    images: [],
    slug: '4-0x2-5-100002'
  },
  {
    id: 'fallback-3',
    title: '3.0 x 1.5',
    width: 3.0,
    extension: 1.5,
    description: ['กันสาดพับเก็บได้สำหรับบ้านพักอาศัย ติดตั้งระเบียง ป้องกันแสงแดดและฝน'],
    category: 'บ้านพักอาศัย',
    location: 'นนทบุรี',
    year: '2024',
    type: 'ระบบมือหมุน',
    arms_count: '2',
    canvas_material: 'ผ้าอะคริลิคสเปน',
    fabric_edge: 'ตัดเรียบ',
    featured_image: '/images/default-project.jpg',
    images: [],
    slug: '3-0x1-5-100003'
  },
  {
    id: 'fallback-4',
    title: '5.0 x 3.0',
    width: 5.0,
    extension: 3.0,
    description: ['กันสาดพับเก็บได้สำหรับโรงแรม สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า) ให้ความยืดหยุ่นในการใช้งาน'],
    category: 'โรงแรม',
    location: 'ภูเก็ต',
    year: '2024',
    type: 'สองระบบ (มือหมุน + มอเตอร์ไฟฟ้า)',
    arms_count: '4',
    canvas_material: 'ผ้าอะคริลิคสเปน',
    fabric_edge: 'โค้งลอน',
    featured_image: '/images/default-project.jpg',
    images: [],
    slug: '5-0x3-0-100004'
  }
];

// Server-side Firestore service using Firebase Admin SDK with static fallback
export const projectsAdminService = {
  // Get all projects
  async getAll(): Promise<Project[]> {
    try {
      console.log('🚀 [DEBUG] Starting getAll() method');
      console.log('🔍 [DEBUG] adminDb available?', !!adminDb);
      
      if (!adminDb) {
        console.warn('⚠️ Firebase Admin not available, using static fallback data');
        console.log('📋 [DEBUG] Fallback projects count:', fallbackProjects.length);
        return fallbackProjects;
      }

      console.log('📊 Fetching projects from Firestore with Admin SDK...');
      const projectsCol = adminDb.collection('projects');
      const querySnapshot = await projectsCol.orderBy('created_at', 'desc').get();
      
      console.log(`✅ Found ${querySnapshot.size} projects in Firestore`);
      
      if (querySnapshot.size === 0) {
        console.log('📋 No projects in Firestore, returning fallback data');
        console.log('📋 [DEBUG] Fallback projects count:', fallbackProjects.length);
        return fallbackProjects;
      }
      
      const projectList: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`📄 Project: ${doc.id} - ${data.title || 'No title'}`);
        projectList.push(serializeProject({ id: doc.id, ...data }));
      });
      
      console.log('✅ [DEBUG] Returning project list with length:', projectList.length);
      return projectList;
    } catch (error) {
      console.error('❌ Firebase Admin getAll error:', error);
      console.warn('🔄 Using static fallback data due to Firebase error');
      console.log('📋 [DEBUG] Fallback projects count:', fallbackProjects.length);
      return fallbackProjects;
    }
  },

  // Get project by ID
  async getById(id: string): Promise<Project | null> {
    try {
      if (!adminDb) {
        console.warn('Firebase Admin not available, using static fallback data');
        return fallbackProjects.find(p => p.id === id) || null;
      }

      const projectDoc = adminDb.collection('projects').doc(id);
      const doc = await projectDoc.get();
      
      if (!doc.exists) {
        return null;
      }
      
      return serializeProject({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Firebase Admin getById error:', error);
      console.warn('Using static fallback data due to Firebase error');
      return fallbackProjects.find(p => p.id === id) || null;
    }
  },

  // Get projects by category
  async getByCategory(category: string): Promise<Project[]> {
    try {
      if (!adminDb) {
        console.warn('Firebase Admin not available, using static fallback data');
        return fallbackProjects.filter(p => p.category === category);
      }

      const projectsCol = adminDb.collection('projects');
      const querySnapshot = await projectsCol
        .where('category', '==', category)
        .orderBy('created_at', 'desc')
        .get();
      
      const projectList: Project[] = [];
      querySnapshot.forEach((doc) => {
        projectList.push(serializeProject({ id: doc.id, ...doc.data() }));
      });
      
      return projectList;
    } catch (error) {
      console.error('Firebase Admin getByCategory error:', error);
      console.warn('Using static fallback data due to Firebase error');
      return fallbackProjects.filter(p => p.category === category);
    }
  },

  // Get project by slug
  async getBySlug(slug: string): Promise<Project | null> {
    try {
      if (!adminDb) {
        console.warn('Firebase Admin not available, using static fallback data');
        return fallbackProjects.find(p => p.slug === slug.toLowerCase()) || null;
      }

      // Normalize slug to lowercase
      const normalizedSlug = slug.toLowerCase();
      console.log(`🔍 Searching for project with slug: ${normalizedSlug}`);

      const projectsCol = adminDb.collection('projects');
      const querySnapshot = await projectsCol.where('slug', '==', normalizedSlug).get();
      
      if (querySnapshot.empty) {
        console.log(`❌ No project found with slug: ${normalizedSlug}`);
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      console.log(`✅ Found project: ${doc.id} - ${doc.data().title}`);
      return serializeProject({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Firebase Admin getBySlug error:', error);
      console.warn('Using static fallback data due to Firebase error');
      return fallbackProjects.find(p => p.slug === slug.toLowerCase()) || null;
    }
  },

  // Get related projects by IDs
  async getRelatedProjects(projectIds: string[]): Promise<Project[]> {
    try {
      if (!adminDb) {
        console.warn('Firebase Admin not available, using static fallback data');
        return fallbackProjects.filter(p => projectIds.includes(p.id));
      }

      if (projectIds.length === 0) return [];
      
      const projectsCol = adminDb.collection('projects');
      const projectPromises = projectIds.map(id => 
        projectsCol.doc(id).get()
      );
      
      const projectSnapshots = await Promise.all(projectPromises);
      const projects = projectSnapshots
        .filter(snapshot => snapshot.exists)
        .map(snapshot => serializeProject({ id: snapshot.id, ...snapshot.data() }));
      
      return projects;
    } catch (error) {
      console.error('Firebase Admin getRelatedProjects error:', error);
      console.warn('Using static fallback data due to Firebase error');
      return fallbackProjects.filter(p => projectIds.includes(p.id));
    }
  },

  // Delete project by ID
  async deleteById(projectId: string): Promise<boolean> {
    try {
      if (!adminDb) {
        console.warn('Firebase Admin not available, cannot delete project');
        return false;
      }

      console.log(`🗑️ Deleting project with ID: ${projectId}`);
      
      const projectRef = adminDb.collection('projects').doc(projectId);
      await projectRef.delete();
      
      console.log(`✅ Successfully deleted project: ${projectId}`);
      return true;
    } catch (error) {
      console.error('Firebase Admin deleteById error:', error);
      return false;
    }
  },

  // Delete project by slug
  async deleteBySlug(slug: string): Promise<boolean> {
    try {
      if (!adminDb) {
        console.warn('Firebase Admin not available, cannot delete project');
        return false;
      }

      // First find the project by slug
      const project = await this.getBySlug(slug);
      if (!project) {
        console.log(`❌ No project found with slug: ${slug}`);
        return false;
      }

      return await this.deleteById(project.id);
    } catch (error) {
      console.error('Firebase Admin deleteBySlug error:', error);
      return false;
    }
  },

  // Increment view count for a project
  async incrementViewCount(projectId: string): Promise<boolean> {
    try {
      if (!adminDb) {
        console.warn('Firebase Admin not available, cannot increment view count');
        return false;
      }

      console.log(`👁️ Incrementing view count for project: ${projectId}`);

      const projectRef = adminDb.collection('projects').doc(projectId);

      // Use FieldValue.increment for atomic update
      await projectRef.update({
        viewCount: admin.firestore.FieldValue.increment(1),
        lastViewedAt: new Date().toISOString()
      });

      console.log(`✅ Successfully incremented view count for project: ${projectId}`);
      return true;
    } catch (error) {
      console.error('Firebase Admin incrementViewCount error:', error);
      return false;
    }
  }
};

// Fallback articles data
const fallbackArticles: Article[] = [];

export const articlesAdminService = {
  // Get all articles (including drafts for admin)
  async getAll(): Promise<Article[]> {
    try {
      if (!adminDb) {
        console.warn('Firebase Admin not available, returning empty articles array');
        return fallbackArticles;
      }

      const articlesCol = adminDb.collection('articles');
      // ✅ FIX: ดึงทั้งหมด ไม่กรอง published_at (เพื่อให้ admin เห็น draft ด้วย)
      const querySnapshot = await articlesCol
        .orderBy('created_at', 'desc')  // เรียงตาม created_at แทน published_at
        .get();

      const articleList: Article[] = [];
      querySnapshot.forEach((doc) => {
        articleList.push(serializeArticle({ id: doc.id, ...doc.data() }));
      });

      console.log(`✅ articlesAdminService.getAll() → ${articleList.length} articles (including drafts)`);
      return articleList;
    } catch (error) {
      console.error('Firebase Admin getAll articles error:', error);
      console.warn('Returning empty articles array due to Firebase error');
      return fallbackArticles;
    }
  },

  // Get article by slug
  async getBySlug(slug: string): Promise<Article | null> {
    try {
      if (!adminDb) {
        console.warn('Firebase Admin not available, returning null for article');
        return null;
      }

      const articlesCol = adminDb.collection('articles');
      const querySnapshot = await articlesCol.where('slug', '==', slug).get();
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return serializeArticle({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Firebase Admin getBySlug error:', error);
      console.warn('Returning null for article due to Firebase error');
      return null;
    }
  }
};