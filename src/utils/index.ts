// @ts-nocheck
export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

