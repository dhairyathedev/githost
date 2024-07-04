import fs from "fs/promises";
import path from "path";

export const getAllFiles = async (folderPath: string): Promise<string[]> => {
    let response: string[] = [];

    const allFilesAndFolders = await fs.readdir(folderPath);
    for (const fileOrFolder of allFilesAndFolders) {
        const fullPath = path.join(folderPath, fileOrFolder);
        const isDirectory = (await fs.lstat(fullPath)).isDirectory();
        if (isDirectory) {
            response = response.concat(await getAllFiles(fullPath));
        } else {
            response.push(fullPath);
        }
    }

    return response;
};