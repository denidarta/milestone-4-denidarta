import { parseSearchTerm, buildUserSearchWhere } from './search.helper';

describe('parseSearchTerm', () => {
	it('should return term and null numericValue for non-numeric string', () => {
		const result = parseSearchTerm('john');

		expect(result).toEqual({ term: 'john', numericValue: null });
	});

	it('should return term and numericValue for numeric string', () => {
		const result = parseSearchTerm('42');

		expect(result).toEqual({ term: '42', numericValue: 42 });
	});

	it('should return no numericValue for partial numeric string', () => {
		const result = parseSearchTerm('john123');

		expect(result).toEqual({ term: 'john123', numericValue: null });
	});
});

describe('buildUserSearchWhere', () => {
	it('should include name and email conditions for non-numeric search', () => {
		const result = buildUserSearchWhere('john');

		expect(result.OR).toHaveLength(2);
		expect(result.OR).toContainEqual({
			name: { contains: 'john', mode: 'insensitive' },
		});
		expect(result.OR).toContainEqual({
			email: { contains: 'john', mode: 'insensitive' },
		});
	});

	it('should include id and accountNumber conditions for numeric search', () => {
		const result = buildUserSearchWhere('42');

		expect(result.OR).toHaveLength(4);
		expect(result.OR).toContainEqual({ id: 42 });
		expect(result.OR).toContainEqual({
			accounts: { some: { accountNumber: 42 } },
		});
	});

	it('should not include id and accountNumber conditions for non-numeric search', () => {
		const result = buildUserSearchWhere('john');
		expect(result.OR).toEqual([
			{ name: { contains: 'john', mode: 'insensitive' } },
			{ email: { contains: 'john', mode: 'insensitive' } },
		]);
	});
});
