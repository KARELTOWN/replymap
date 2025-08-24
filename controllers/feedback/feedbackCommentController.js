import { matchedData, validationResult } from "express-validator";
import FeedbackComment from "../../models/FeedbackComment.js";
import Files from "../../models/Files.js";

export default function feedbackCommentController() {
  const getFeedbackComments = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req);

    let comments = await FeedbackComment.find({
      feedback_id: data.feedback_id,
    })
      .skip(data.skip)
      .limit(50)
      .sort({ createdAt: -1 })
      .exec();

    let commentsWithFiles = [];

    for (let comment of comments) {
      let files = await Files.find({ comment_id: comment._id });
      commentsWithFiles.push({
        ...comment.toObject(),
        files,
      });
    }

    res.status(200).json({
      message: "Commentaires récupérés",
      data: commentsWithFiles,
    });
  };

  const storeComment = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
      }
      const data = matchedData(req);
      const attachments = req.files ? req.files : [];

      let attachmentsResult = [];
      if (attachments.length > 0) {
        attachmentsResult = await uploadFilesOnS3(attachments, data.project_id);
      }

      if (attachmentsResult.length === attachments.length) {
        const comment = await FeedbackComment.create({
          ...data,
        });

        let filesAttach = [];
        for (const element of attachmentsResult) {
          filesAttach.push({
            key: element.key,
            comment_id: comment._id,
            name: element.name,
            type: element.type,
            size: element.size,
          });
        }

        await Files.insertMany(filesAttach);

        let newComment = { ...comment, files: attachmentsResult };

        res
          .status(200)
          .json({ message: "Commentaire enregistré", data: newComment });
      }

      res.status(500).json({ message: "Erreur de création du commentaire" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  return {
    getFeedbackComments,
    storeComment,
  };
}
