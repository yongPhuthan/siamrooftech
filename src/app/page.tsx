'use server'
import Main from './components/Main';

import { Suspense } from 'react'
interface Props {
  params: {
    id: string;
  };
  searchParams: { 
    kw: string;
  };
}



export default async function Home(props: Props) {
const keyword = props.searchParams.kw;
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
        <Main  keyword={keyword ?  keyword :'กันสาดพับได้'}/>
       {/* <Main projects={projectsByTag} /> */}
      </div>
  );
}
