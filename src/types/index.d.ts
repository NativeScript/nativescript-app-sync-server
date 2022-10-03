export type PackageInfo = {
    description: string
    isDisabled: boolean
    isMandatory: boolean
    rollout: number
    appVersion: string
}

export type PackageInfoBuild = {
    packageHash: string;
    path: string;
    contentPath: string;
    manifestFilePath: string;
}

export type UpdateModelAttrs<T> = Partial<Omit<T, 'id'>>
