export type Project ={
    id: string;
    tags: string[];
    description: string[];
    images: Images[];
}

export type Images = {
    smallSize: string;
    originalSize: string;
}

declare global {
    interface Window {
      dataLayer: any[];
    }
    
    function gtag_report_conversion(url: string): boolean;
  }