import api from './axios';
import { questionBankApi } from './questionBankApi';

/**
 * @deprecated Use questionBankApi — hierarchy is now
 * QuestionBank (school year) → Subject → Questions.
 */
export const subjectApi = {
  list: questionBankApi.listBanks,
  create: questionBankApi.createBank,
  get: questionBankApi.getBank,
  createBank: questionBankApi.createSubject,
  getBank: questionBankApi.getSubject,
  createQuestion: questionBankApi.createQuestion,
  updateQuestion: questionBankApi.updateQuestion,
  toggleSelection: questionBankApi.toggleSelection,
  deleteQuestion: questionBankApi.deleteQuestion,
};
