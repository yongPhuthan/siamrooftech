import React from 'react';
import Card from '../../components/ui/Card';
type ProductTypeProps = {
    keyword: string;
    };


function ProductType(props: ProductTypeProps) {
    const { keyword  } = props;
  const projects = [
    {
      id: 1,
      title: `${keyword} ร้านอาหาร-คาเฟ่`,
      description: 'This is the first project',
      image:
        'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/34660',
    },
    {
      id: 2,
      title: `${keyword} ระเบียงบ้าน`,
      description: 'This is the second project',
      image:
        'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/17201',
    },
    {
      id: 3,
      title: ` ${keyword} อาคาร-โรงแรม`,
      description: 'This is the third project',
      image:
        'https://pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev/siamrooftech/original/28177',
    },
  ];
  return (
    <>
      <div className="rounded m-4 md:m-20">
        {/* <h2 className="font_page font-bold my-5 md:my-10 text-xl md:text-3xl text-center ">
กันสาดที่เหมาะกับหน้างานของคุณ
        </h2> */}
            <p className="text-left mt-10 font_page font-bold md:text-3xl text-xl border-l-4 border-blue-500 pl-4">
            IDEAติดตั้ง {keyword}สวยๆ

            </p>
        <div className="grid grid-cols-1 container mt-5  mx-auto gap-4 md:gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project:any) => (
            <div key={project.id} className="h-auto md:h-200">
              <Card key={project.id} project={project} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default ProductType;
