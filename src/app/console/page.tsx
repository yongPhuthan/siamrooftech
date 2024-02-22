import { redirect } from 'next/navigation';
import { db } from '@/db'; // Ensure you have configured your db client correctly

export default function ProjectCreatePage() {
  async function createProject(formData: FormData) {
    'use server';

    // Assuming tags are submitted as a comma-separated list
    const tagsString = formData.get('tags') as string;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()); // Split by comma and trim whitespace

    const imagesData = {
      smallSize: formData.get('smallSize') as string,
      originalSize: formData.get('originalSize') as string,
    };

    const descriptionData = {
      address: formData.get('address') as string,
      type: formData.get('type') as string,
      size: formData.get('size') as string,
      material: formData.get('material') as string,
    };

    try {
      const project = await db.project.create({
        data: {
          tags: tagsArray,
          images: {
            create: imagesData,
          },
          description: {
            create: descriptionData,
          },
        },
      });

      redirect('/projects');
    } catch (error) {
      console.error("Failed to create project:", error);
      // Handle the error appropriately
      // Maybe redirect to an error page or display an error message
    }
  }

  return (
    <div className='p-10 justify-center items-center h-screen w-full bg-gray-100'>
      <form action={createProject}>
        <h3 className="font-bold m-3">Create a Project</h3>
        <div className="flex flex-col gap-4">
          <input
            name="tags"
            placeholder="Tags (comma separated)"
            className="border rounded p-2"
          />
          <textarea
            name="address"
            placeholder="Address"
            className="border rounded p-2"
          />
          <input
            name="type"
            placeholder="Type"
            className="border rounded p-2"
          />
          <input
            name="size"
            placeholder="Size"
            className="border rounded p-2"
          />
          <input
            name="material"
            placeholder="Material"
            className="border rounded p-2"
          />
          <input
            name="smallSize"
            placeholder="Image Small Size URL"
            className="border rounded p-2"
          />
          <input
            name="originalSize"
            placeholder="Image Original Size URL"
            className="border rounded p-2"
          />
          <button type="submit" className="rounded p-2 bg-blue-200">
            Create Project
          </button>
        </div>
      </form>
    </div>
  );
}
