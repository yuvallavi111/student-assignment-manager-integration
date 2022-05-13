import mondayService from "../services/monday-service";
import TRANSFORMATION_TYPES from "../constants/transformation";
import transformationService from "../services/transformation-service";

export async function executeColumnChange(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;
  try {
    const { inboundFieldValues } = payload;
    const { boardId, itemId, groupId } = inboundFieldValues;

    const groupIndex = await mondayService.getGroupIndex(
      shortLivedToken,
      boardId,
      groupId
    );

    const itemCount = await mondayService.getItemCountInGroup(
      shortLivedToken,
      boardId,
      groupId
    );

    let myAssignments = await mondayService.getAssignmentsData(
      shortLivedToken,
      boardId
    );
    myAssignments = myAssignments?.map((a) => {
      return a === "Not Available" ? 0 : parseInt(a);
    });
    console.log(myAssignments);
    return res.status(200).send({});
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "internal server error" });
  }
}

export async function executeAction(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  try {
    const { inboundFieldValues } = payload;
    const {
      boardId,
      itemId,
      sourceColumnId,
      targetColumnId,
      transformationType,
    } = inboundFieldValues;

    const text = await mondayService.getColumnValues(
      shortLivedToken,
      itemId,
      sourceColumnId
    );
    if (!text) {
      return res.status(200).send({});
    }
    const transformedText = transformationService.transformText(
      text,
      transformationType ? transformationType.value : "TO_UPPER_CASE"
    );

    await mondayService.changeColumnValue(
      shortLivedToken,
      boardId,
      itemId,
      targetColumnId,
      transformedText
    );

    return res.status(200).send({});
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "internal server error" });
  }
}

export async function getRemoteListOptions(req, res) {
  try {
    return res.status(200).send(TRANSFORMATION_TYPES);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "internal server error" });
  }
}
