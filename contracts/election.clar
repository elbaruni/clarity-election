 (define-constant admin 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 ) ;; admin only allowed to add candidates and open or close elections
  
  (define-constant open 1 ) ;; constant to set registration / election open 
  
  (define-constant close 0 );; constant to set registration / election closed 

 (define-map Candidates ;; mapping to store all candidates and their voting count
  ((candidateId int)  )
  ((name (buff 40)) (votescount uint))) 
 
  (define-map voters ((voter principal)) ((voted uint ))) ;; mapping to store all voted address 
 
 (define-data-var numberOfCandidates int 0) ;; variable to track number of candidates
 
  (define-data-var RegistrationIsOpen int open) ;; Registration is open =1 otherwise is closed
 
  (define-data-var votingIsOpen int open) ;;voting is open=1 otherwise is closed
 
 (define-private (incrementCandidates)  ;; incress number of candidates counter
    (begin
     (var-set numberOfCandidates (+ (var-get numberOfCandidates) 1))
     (ok (var-get numberOfCandidates)))) 

 (define-private (getName (candidateId int) ) ;; cntract only to get candidate name
  (begin
  (default-to " "
    (get name
         (map-get? Candidates ((candidateId candidateId) ))))
         ))

(define-private (getVotesCount (candidateId int) ) ;; cntract only to get candidate votes count
  (begin
  (default-to u0
    (get votescount
         (map-get? Candidates ((candidateId candidateId) ))))
         ))

(define-private (getVoted (voter principal) ) ;; cntract only to get voter vote status u0 means did not vote before
  (begin
  (default-to u0
    (get voted
         (map-get? voters ((voter voter) ))))
         ))

(define-public (getCandidateName (candidateId int)  ) ;; to get a  candidate name by id
  (let ((name (getName candidateId)))
    (begin
    (ok name)
      )))

(define-public (getCandidateVotesCount (candidateId int)  ) ;; to get a candidate votes count by id
  (let ((count (getVotesCount candidateId)))
    (begin
    (ok count)
      ))) 

 (define-public (getNumberOfCandidates)  ;; to get number of candidates registered
   (ok (var-get numberOfCandidates)))
  
   (define-public (isRegistrationOpen) ;; to get   Registration   status
    (ok (var-get RegistrationIsOpen)))
 
 (define-public (isVotingOpen) ;; to get if voting open  status
    (ok (var-get votingIsOpen)))


    (define-public (endRegistration)  ;; closes registering new candidates
   (if (is-eq admin tx-sender) 
   (begin
     (var-set RegistrationIsOpen close)
     (ok 1))
     (err 0)
   )
    ) 
;; Admin controls the smart contract functionalities
    (define-public (endElection)  ;; stop accepting new votes  
   (if (is-eq admin tx-sender)  ;; only admin
   (begin
     (var-set votingIsOpen close)
     (ok 1))
     (err 0)
   )
    ) 

     (define-public (startRegistration)  ;; allowing to register new candidates
   (if (is-eq admin tx-sender)  ;;only admin
   (begin
     (var-set RegistrationIsOpen open)
     (ok 1))
     (err 0)
   )
    ) 

    (define-public (startElection)  ;; start election voting and accepting new votes  
   (if (is-eq admin tx-sender)  ;; only admin 
   (begin
     (var-set votingIsOpen open)  
     (ok 1))
     (err 0)
   )
    ) 
    ;; Admin registering new candidate  
 (define-public (addCandidate  ( name (buff 40)))   ;; to register new Candidates
     
    (if (and  (is-eq admin tx-sender) ;; only admin allowed to add new candidate
     (is-eq (var-get RegistrationIsOpen) 1) ;;check  if Registration is open  to register new candidate
     
      )  (begin    
    (map-set Candidates ((candidateId (+ (var-get numberOfCandidates) 1))) ((name name)
       (votescount (to-uint 0)))) 
      (incrementCandidates   )
       (ok 1)
    ) (err 0))    
    )    
;; Voters casting their vote for a candidate only one vote allowed
    (define-public (vote    (candidateId int))   ;; to vote for a   Candidate

    (let ((voted (getVoted tx-sender))  (electionStatus (var-get votingIsOpen)) (count (getVotesCount candidateId))  (name (getName candidateId)))
        (if  (and (is-eq voted u0) ;; is voter did not vote before
          (is-eq electionStatus open)
           (> candidateId 0) (<= candidateId (var-get numberOfCandidates) ) ;; validating  candidateID
             )
            (begin ;; 
        (map-set Candidates ((candidateId candidateId)) ((name name)
       (votescount (+ count u1) ))) ;; add new vote for candidateID
      (map-set voters ((voter tx-sender)) ((voted u1)    ;; change voter state to voted by setting to 1 ,not 0       
       )) 
    (ok 1) ;; return ok
      )      
   (err 0)) ;; return error when one of validation condations failed
    ))
 
 

 
