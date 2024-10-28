export function mapURLtoAbsoluteUrlPathWithSearchAndFragment(url: URL): string {
	return url.pathname + url.search + url.hash;
}

const PATH_SEPARATOR = '/';

const INVALID_PATH_PARTS = {
	PARENT_DIR: '..',
	CURRENT_DIR: '.',
	EMPTY: ''
};

function isValidPathSegment(segment: string): boolean {
	return !Object.values(INVALID_PATH_PARTS).includes(segment);
}

export function mapStringToAbsoluteUrlPath(path: string): string {
	const url = new URL(path, 'http://x');
	return (
		PATH_SEPARATOR +
		decodeURI(url.pathname).split(PATH_SEPARATOR).filter(isValidPathSegment).join(PATH_SEPARATOR)
	);
}
