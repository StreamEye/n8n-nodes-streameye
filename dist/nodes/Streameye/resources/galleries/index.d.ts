import type { INodeProperties } from 'n8n-workflow';
export type GalleryOperation = 'listGalleryAssets';
export declare const galleryOperations: {
    listGalleryAssets: {
        responseKey: string;
        query: string;
        getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number) => {
            filter: {
                gid: string;
                keyword: string;
            };
            orderBy: {
                key: string;
                dir: string;
            }[] | undefined;
            from: number;
            size: number;
        };
    };
};
export declare const galleryDescription: INodeProperties[];
