#해야 할 일

###컨트롤러
- [x] 좋아요 버튼 기능 구현
- [x] 큐 열기 기능 구현
- [x] 툴팁 달기

###큐매니저
- [x] 라이브러리 컨텍스트일 때 current 앞 뒤로 달아주는 메소드
- [x] 곡 순서가 바뀌었을 때 핸들러
- [x] 큐 섞기 기능 => 맵에 추가하는 거 제대로 구현해야 함.
- [x] 큐 복원 기능
- [x] 섞기 또는 복원 시 current 찾아주는 기능
- [x] 기록 스택 비우기 메소드
- [x] 바로 다음에 재생 기능
- [x] 맨 나중에 재생 기능
- [x] 플레이리스트 수정 시 반영하는 메소드
- [x] 큐 아이템 제거 시 메소드
- [x] 오류 및 구조 수정
- [x] 툴팁 제작
- [x] 프로퍼티 초기화 문제 해결

###디버그 용 모듈 제작
- [x] 해시 생성 클래스 제작 -> 제목에서 특수문자 걷어내고 lowercase 적용
- [x] db 배열 객체로 변환하는 메소드
- [x] 객체들 저장하는 해시 테이블
- [x] 기록 스택과 큐에 넣어주는 메소드
- [x] play 메소드들 임시로 구현
- [x] 큐매니저 선언 -> 컨트롤러 선언해서 정상작동 확인.
- [x] 라이브러리 매니저 - 정렬된 배열 만들기
- [x] 라이브러리 매니저 - 이전 곡 다음 곡 골라주는 메소드 구현.
- [x] 임시 플레이리스트 만들고 플레이리스트 메소드 구현
- [x] play next 디버그
- [x] play later 디버그
- [x] 라이브러리 play this 디버그 + shuffle 디버그
- [x] 플레이리스트 play this 디버그
- [x] apply playlist change 디버그
- [x] makeup library 디버그
- [x] 큐 열기 tab manager 활용해서 수정

###라이브러리 매니저
- [ ] 검색 기능 만들기
=> 
1. 자동완성(db 만들 때부터 리스트를 만들어서 정렬)
2. 검색 필터 #제목, #가수 #이 처음에 입력되면 어떤 필터인지를 감지, 스페이스바로 컨펌.
3. 엔터 키를 누르거나 blur 이벤트에 검색 최신화.
- [ ] 검색 필터 만들기
- [ ] 정렬 기능 만들기(개 쉬움)
=> 정렬 기능이 실행될 때마다 검색 최신화.
- [ ] playThis 메소드 수정(검색 결과 틀 수 있도록)