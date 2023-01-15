import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import {
  Epic,
  Feature,
  OfficeTimeline,
  Team,
  TicketType,
} from "src/models/models";
import { read, utils, writeFile } from "xlsx";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  title = "app";

  data: any = null;
  teams: Map<string, Team> = new Map<string, Team>();
  currentFeatureName: string = "";

  constructor(private http: HttpClient) {}

  async ngOnInit(): Promise<void> {
    // this.getData();
  }

  async getData(event: any): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file: File = (target.files as FileList)[0];
    console.log(file);
    const f = await file.arrayBuffer();
    const wb = read(f);
    console.log(wb.Sheets[wb.SheetNames[0]]);
    this.data = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    console.log(this.data);
    this.buildTeams();
  }

  buildTeams(): void {
    this.data.forEach((element: any) => {
      let ticketType = element["Hierarchy"];
      if (ticketType === TicketType.Feature) {
        this.currentFeatureName = element["Title"];
      } else if (ticketType === TicketType.Epic) {
        const team = element["Team"];
        if (team) {
          // The team exists
          if (this.teams.has(team)) {
            const currentTeam: Team | undefined = this.teams!.get(team);
            this.modifyTeam(currentTeam, element);
          } else {
            //Need to build a new team
            this.buildNewFeature(element, team);
          }
        }
      }
    });
    this.createOfficeTimelineSheets();
  }

  buildNewFeature(element: any, team: string) {
    let swimlanes: Feature[] = new Array();
    let epics: Epic[] = new Array();
    let epic: Epic = {
      title: element["Title"],
      type: "Task",
      startDate: element["Start date"],
      endDate: element["Due date"],
    };
    epics.push(epic);
    let feature: Feature = {
      name: this.currentFeatureName,
      epics,
    };
    swimlanes.push(feature);
    let newTeam: Team = {
      name: team,
      swimlanes,
    };
    this.teams.set(team, newTeam);
  }

  modifyTeam(team: Team | undefined, element: any) {
    // create the epic
    let epic: Epic = {
      title: element["Title"],
      type: "Task",
      startDate: element["Start date"],
      endDate: element["Due date"],
    };
    // check if swimlane exists
    let existingSwimlane = team?.swimlanes.filter(
      (swimlane: Feature) => swimlane.name === this.currentFeatureName
    )[0];
    if (existingSwimlane) {
      existingSwimlane.epics.push(epic);
    } else {
      // create a new swimlane and assign the epic
      let epics: Epic[] = new Array();
      epics.push(epic);
      let feature: Feature = {
        name: this.currentFeatureName,
        epics,
      };
      team?.swimlanes.push(feature);
    }
  }

  createOfficeTimelineSheets() {
    // create an array from each team name
    // loop through each team, create a row for each epic (Task) using the swimlane name
    // create a workbook for that team
    let books = new Array();
    this.teams.forEach((team: Team) => {
      let officeTimelines: OfficeTimeline[] = new Array<OfficeTimeline>();
      team.swimlanes.forEach((feature: Feature) => {
        feature.epics.forEach((epic: Epic) => {
          let task: OfficeTimeline = {
            Swimlane: feature.name,
            Type: "Task",
            Status: "",
            Title: epic.title,
            StartDate: epic.startDate,
            EndDate: epic.endDate,
          };
          officeTimelines.push(task);
        });
      });
      books.push(officeTimelines);
    });
    let obj = Object.fromEntries(this.teams);
    let teamNames = Object.keys(obj);
    const workbook = utils.book_new();
    books.forEach((book, i) => {
      let worksheet = utils.json_to_sheet(book);
      let cleanedSheet = utils.sheet_add_aoa(
        worksheet,
        [["Swimlane", "Type", "Status", "Title", "Start date", "End date"]],
        { origin: "A1" }
      );
      utils.book_append_sheet(workbook, cleanedSheet, `${teamNames[i]}`);
    });

    writeFile(workbook, "FZero.xlsx", {
      compression: true,
    });
  }
}
