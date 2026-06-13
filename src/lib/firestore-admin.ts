import { Project, Article } from './firestore';
import { fileProjectsService } from './file-projects';

async function getFirebaseAdmin() {
  return await import('./firebase-admin');
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

// Public project reads are intentionally file-based: the portfolio is small,
// deploys are deterministic, and production does not need Firebase secrets.
export const projectsAdminService = {
  async getAll(): Promise<Project[]> {
    return fileProjectsService.getAll();
  },

  async getById(id: string): Promise<Project | null> {
    return fileProjectsService.getById(id);
  },

  async getByCategory(category: string): Promise<Project[]> {
    return fileProjectsService.getByCategory(category);
  },

  async getBySlug(slug: string): Promise<Project | null> {
    return fileProjectsService.getBySlug(slug);
  },

  async getRelatedProjects(projectIds: string[]): Promise<Project[]> {
    return fileProjectsService.getRelatedProjects(projectIds);
  },

  // Delete project by ID
  async deleteById(projectId: string): Promise<boolean> {
    try {
      const { adminDb } = await getFirebaseAdmin();
      if (!adminDb) {
        console.warn('Firebase Admin not available, cannot delete project');
        return false;
      }

      const projectRef = adminDb.collection('projects').doc(projectId);
      await projectRef.delete();

      return true;
    } catch (error) {
      console.error('Firebase Admin deleteById error:', error);
      return false;
    }
  },

  // Delete project by slug
  async deleteBySlug(slug: string): Promise<boolean> {
    try {
      const project = await this.getBySlug(slug);
      if (!project) {
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
      const { default: admin, adminDb } = await getFirebaseAdmin();
      if (!adminDb) {
        console.warn('Firebase Admin not available, cannot increment view count');
        return false;
      }

      const projectRef = adminDb.collection('projects').doc(projectId);

      // Use FieldValue.increment for atomic update
      await projectRef.update({
        viewCount: admin.firestore.FieldValue.increment(1),
        lastViewedAt: new Date().toISOString()
      });

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
      const { adminDb } = await getFirebaseAdmin();
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
      const { adminDb } = await getFirebaseAdmin();
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
