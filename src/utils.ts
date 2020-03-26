export function removeRelativePathFromUrl(url: string) {
  return url.replace(/^.+\.\//, '').replace('./', '');
}

/* Dynamic linking is not supported. */
const regex = new RegExp(/__\$\w+\$__/, 'g');
const address = '0000000000000000000000000000000000000000';
export function replaceLinkedLibs(byteCode: string) {
  return byteCode.replace(regex, address);
}
