export interface ICreateFeedback {
	rating: number;
	comment?: string;
	complaintId: string;
}

export interface IUpdateFeedback {
	rating?: number;
	comment?: string;
}
