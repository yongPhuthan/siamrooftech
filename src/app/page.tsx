import Main from './components/Main';

import { Suspense } from 'react'
// interface Props {
//   params: {
//     id: string;
//   };
//   searchParams: { 
//     kw: string;
//   };
// }



export default async function Home() {
// const keyword = props.searchParams.kw;
const keyword  = 'กันสาดพับได้'
  return (
    <div className="bg-white ">
        <Main  keyword={keyword ?  keyword :'กันสาดพับได้'}/>
       {/* <Main projects={projectsByTag} /> */}
      </div>
  );
}
