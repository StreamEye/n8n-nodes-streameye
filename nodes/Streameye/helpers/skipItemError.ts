/**
 * Thrown by an operation when the current item cannot be processed but the
 * workflow should NOT fail. The node loop catches this, emits an n8n warning
 * hint, outputs an empty value for the item, and continues with the next one —
 * regardless of the node's "Continue On Fail" setting.
 */
export class SkipItemError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SkipItemError';
	}
}
