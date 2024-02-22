import Main from './components/Main';
import { Suspense } from 'react'

export default async function Home() {
  // const tags = await db.tags.findMany({
  //   orderBy: {
  //     number: 'asc', // or 'desc' for descending
  //   },
  // });
  // const projectsByTag = await Promise.all(tags.map(async (tag) => {
  //   const projects = await db.project.findMany({
  //     where: {
  //       tagNumber: {
  //         has: tag.number,
  //       },
  //     },
  //     include: {
  //       images: true, // Assuming you also want to fetch related images
  //     },
  //   });
  //   return {
  //     tag,
  //     projects,
  //   };
  // }));



  return (
    <div className="bg-white ">
        <Main />
       {/* <Main projects={projectsByTag} /> */}
      </div>
  );
}
