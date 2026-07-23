import { questionBankApi } from './questionBankApi';

/** @deprecated Prefer questionBankApi */
export const subjectApi = {
  list: () => questionBankApi.listSubjects(),
  create: (payload) => questionBankApi.createSubject(payload),
  get: (id) => questionBankApi.getSubject(id),
  createBank: (subjectId, payload) => questionBankApi.createBank(subjectId, payload),
  getBank: (bankId) => questionBankApi.getBank(bankId),
  createQuestion: (bankId, payload) => questionBankApi.createQuestion(bankId, payload),
  updateQuestion: (questionId, payload) => questionBankApi.updateQuestion(questionId, payload),
  toggleSelection: (questionId) => questionBankApi.toggleSelection(questionId),
  deleteQuestion: (questionId) => questionBankApi.deleteQuestion(questionId),
};
