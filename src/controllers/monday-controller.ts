import mondayService from "../services/monday-service";
import TRANSFORMATION_TYPES from "../constants/transformation";
import transformationService from "../services/transformation-service";
import fetch from "cross-fetch";

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

    myAssignments = myAssignments?.map((a: string) => {
      return a === "Processing"
        ? 0
        : ("" + a).includes(":")
        ? parseInt(a.split(":")[0]) * 60 + parseInt(a.split(":")[1])
        : parseInt("" + a);
    });
    console.log(groupIndex);
    console.log(itemCount - 1);
    for (let courseIndex = 0; courseIndex < 5; courseIndex++) {
      myAssignments?.push(courseIndex === groupIndex ? 1 : 0);
    }
    for (let itemIndex = 0; itemIndex < 5; itemIndex++) {
      myAssignments?.push(itemIndex === itemCount - 1 ? 1 : 0);
    }

    fetch(
      "http://a139-192-114-23-237.ngrok.io?vec=" +
        JSON.stringify(myAssignments),
      {
        method: "get",
        headers: {
          "Content-Type": "application/json",
        },
      }
    ).then((res) => {
      res.json().then((data) => {
        console.log(data);
        updateColumn("status5", "" + (data[0] - 1), boardId, itemId);
        updateColumn(
          "text",
          (data[1] < 10 ? "0" : "") + data[1] + ":00",
          boardId,
          itemId
        );
      });
    });

    console.log(myAssignments);
    console.log(myAssignments?.length);
    return res.status(200).send({});
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "internal server error" });
  }
}

async function updateColumn(
  columnId: string,
  value: string,
  boardId: number,
  itemId: number
) {
  const query = `mutation {change_simple_column_value (board_id: ${boardId}, item_id: ${itemId}, column_id: ${columnId}, value: "${value}") {id}}`;

  fetch("https://api.monday.com/v2", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjE2MDMwNDMxMSwidWlkIjoyOTk1NzUwOCwiaWFkIjoiMjAyMi0wNS0xMlQxOTo1MToxNS4wMTJaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTE4NzU5MjIsInJnbiI6InVzZTEifQ.kc5XsEklOx116dzWk_RajsxSgVObTxc3HQn9L4z4USw",
    },
    body: JSON.stringify({
      query,
      client_id: "80341bbdfd347ac503bb1f82a255e9bd",
      client_token:
        "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2ODM5MTk0OTgsImRhdCI6eyJjbGllbnRfaWQiOiI4MDM0MWJiZGZkMzQ3YWM1MDNiYjFmODJhMjU1ZTliZCIsInVzZXJfaWQiOjI5OTU3NTA4LCJhY2NvdW50X2lkIjoxMTg3NTkyMiwic2x1ZyI6Im1vbmRheS10bHYtaGFja2F0aG9uIiwiYXBwX2lkIjoxMDAyNjcxOSwiYXBwX3ZlcnNpb25faWQiOjEwMDM3NzU3LCJpbnN0YWxsX2lkIjotMiwiY2FuX3VwZGF0ZSI6dHJ1ZX19.kEIhVrATGBGVjy3vIIGV25lYeK1NgsthPS33mfYH7ZQ",
    }),
  })
    .catch((e) => console.log(e))
    .then((v) => console.log("value " + JSON.stringify(v)));
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
