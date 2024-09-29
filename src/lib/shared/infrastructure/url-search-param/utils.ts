export function mapURLtoAbsoluteUrlPathWithSearchAndFragment(url: URL): string {
	return url.pathname + url.search + url.hash;
}

export function normalizeAbsoluteUrlPath(path: string): string {
	const sep = '/';
	return decodeURI(path)
		.split(sep)
		.filter((part) => part !== '..' && part !== '.' && part !== '')
		.join(sep);
}
