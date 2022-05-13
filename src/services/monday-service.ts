import initMondayClient from "monday-sdk-js";
const courses = [
  [4, 4, 5, 3],
  [3, 4, 5, 2],
  [6, 6, 5, 5],
  [3, 3, 5, 3],
  [4, 4, 5, 5],
];
class MondayService {
  static async getAssignmentsData(token, boardId) {
    try {
      const mondayClient = initMondayClient();
      mondayClient.setToken(token);

      const query = `query($boardId: [Int]) {
        boards (ids: $boardId) {
          groups {
            items {
              id
            }
          }
        }
      }`;
      const variables = { boardId };

      const response = await mondayClient.api(query, { variables });
      const assignmentsData = [] as any[];
      for (
        let groupIndex = 0;
        groupIndex < response.data.boards[0].groups.length;
        groupIndex++
      ) {
        for (
          let coursePropertyIndex = 0;
          coursePropertyIndex < courses[groupIndex].length;
          coursePropertyIndex++
        ) {
          assignmentsData.push(courses[groupIndex][coursePropertyIndex]);
        }

        const items = response.data.boards[0].groups[groupIndex].items;
        const values = await this.getColumnValues(
          token,
          items.map((i) => parseInt(i.id)),
          ["status5", "text"]
        );
        for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
          assignmentsData.push(values[valueIndex].values[0]);
          assignmentsData.push(values[valueIndex].values[1]);
        }
      }
      return assignmentsData;
    } catch (err) {
      console.log(err);
    }
  }
  static async getItemCountInGroup(token, boardId, groupId) {
    try {
      const mondayClient = initMondayClient();
      mondayClient.setToken(token);

      const query = `query($boardId: [Int]) {
        boards (ids: $boardId) {
          groups {
            id
            items {
              id
            }
          }
        }
      }`;
      const variables = { boardId };

      const response = await mondayClient.api(query, { variables });
      return response.data.boards[0].groups.find((g) => g.id === groupId).items
        .length;
    } catch (err) {
      console.log(err);
    }
  }

  static async getGroupIndex(token, boardId, groupId) {
    try {
      const mondayClient = initMondayClient();
      mondayClient.setToken(token);

      const query = `query($boardId: [Int]) {
        boards (ids: $boardId) {
          groups {
            id
          }
        }
      }`;
      const variables = { boardId };

      const response = await mondayClient.api(query, { variables });
      return response.data.boards[0].groups.map((g) => g.id).indexOf(groupId);
    } catch (err) {
      console.log(err);
    }
  }

  static async getColumnValues(token, itemId, columnId) {
    try {
      const mondayClient = initMondayClient();
      mondayClient.setToken(token);

      const query = `query($itemId: [Int], $columnId: [String]) {
        items (ids: $itemId) {
          id
          column_values(ids:$columnId) {
            text
          }
        }
      }`;
      const variables = { columnId, itemId };

      const response = await mondayClient.api(query, { variables });
      return response.data.items.map((i) => {
        return {
          id: i.id,
          values: i.column_values.map((c) => c.text),
        };
      });
    } catch (err) {
      console.log(err);
    }
  }

  static async changeColumnValue(token, boardId, itemId, columnId, value) {
    try {
      const mondayClient = initMondayClient({ token });

      const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: String!) {
        change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
          id
        }
      }
      `;
      const variables = { boardId, columnId, itemId, value };

      const response = await mondayClient.api(query, { variables });
      console.log(response);
      return response;
    } catch (err) {
      console.log(err);
    }
  }
}

export default MondayService;
