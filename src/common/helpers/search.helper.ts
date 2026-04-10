export function parseSearchTerm(search: string): {
	term: string;
	numericValue: number | null;
} {
	const numericValue = parseInt(search, 10);
	return {
		term: search,
		numericValue: isNaN(numericValue) ? null : numericValue,
	};
}

export function buildUserSearchWhere(search: string) {
	const { term, numericValue } = parseSearchTerm(search);
	return {
		OR: [
			{ name: { contains: term, mode: 'insensitive' as const } },
			{ email: { contains: term, mode: 'insensitive' as const } },
			...(numericValue !== null ? [{ id: numericValue }] : []),
			...(numericValue !== null
				? [{ accounts: { some: { accountNumber: numericValue } } }]
				: []),
		],
	};
}
